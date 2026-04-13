"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  loadReportDraftById,
  marketLabel,
  modeLabel,
  periodLabel,
  type ReportDraftRow,
} from "@/lib/reportDrafts";
import {
  loadLearnerCurriculumPageData,
  type LearnerCurriculumPageData,
} from "@/lib/familyCurriculum";
import {
  loadFamilyWeeklyPlan,
  type FamilyWeeklyPlan,
} from "@/lib/familyPlanner";
import {
  loadReportSupportingEvidence,
  type ReportSupportingEvidenceItem,
} from "@/lib/familyEvidence";
import {
  buildCoverageExplanation,
  buildReportDocumentOverlay,
  buildCurriculumCoverage,
  formatEvidenceReference,
  buildParentLanguageSummary,
  buildReportReadinessScore,
  coverageTone,
  interpretReadiness,
  reportSectionCopy,
} from "@/lib/reportPresentation";
import { supabase } from "@/lib/supabaseClient";

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function getCurrentWeekKey(date = new Date()): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((diffDays + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
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

function learnerLabel(input: {
  draft: ReportDraftRow | null;
  workspaceLearners: Array<{ id: string; label: string }>;
}) {
  const draftStudentId = safe(input.draft?.student_id || input.draft?.child_id);
  const matched = input.workspaceLearners.find((row) => row.id === draftStudentId);
  return matched?.label || safe(input.draft?.child_name) || "Learner";
}

const pageStyle: React.CSSProperties = {
  minHeight: "100%",
  display: "grid",
  gap: 24,
  maxWidth: 980,
  margin: "0 auto",
  paddingBottom: 32,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#ffffff",
  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  padding: 24,
};

const softCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 14,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#64748b",
};

const h1Style: React.CSSProperties = {
  margin: 0,
  fontSize: 34,
  lineHeight: 1.08,
  fontWeight: 950,
  color: "#0f172a",
};

const h2Style: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 950,
  color: "#0f172a",
};

const h3Style: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
};

const sectionEyebrowStyle: React.CSSProperties = {
  ...labelStyle,
  marginBottom: 8,
};

const bodyStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 15,
  lineHeight: 1.7,
  color: "#475569",
};

const smallStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  color: "#64748b",
};

const pillStyle = (
  tone: "success" | "info" | "warning" | "danger" | "secondary",
): React.CSSProperties => {
  const map: Record<string, { bg: string; bd: string; fg: string }> = {
    success: { bg: "#f0fdf4", bd: "#bbf7d0", fg: "#166534" },
    info: { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" },
    warning: { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" },
    danger: { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" },
    secondary: { bg: "#f8fafc", bd: "#e2e8f0", fg: "#475569" },
  };
  const t = map[tone];
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: t.bg,
    border: `1px solid ${t.bd}`,
    color: t.fg,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  };
};

const statStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 14,
  display: "grid",
  gap: 6,
};

const metadataGridStyle: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
};

const actionButtonStyle: React.CSSProperties = {
  minHeight: 40,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 900,
  cursor: "pointer",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  marginBottom: 16,
};

const appendixReferenceStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#e2e8f0",
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

export default function ReportsOutputPage() {
  return (
    <Suspense fallback={null}>
      <ReportsOutputPageContent />
    </Suspense>
  );
}

function ReportsOutputPageContent() {
  const searchParams = useSearchParams();
  const { workspace, activeLearnerId, setActiveLearner, error: workspaceError } =
    useFamilyWorkspace();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ReportDraftRow | null>(null);
  const [curriculumData, setCurriculumData] =
    useState<LearnerCurriculumPageData | null>(null);
  const [plannerData, setPlannerData] = useState<FamilyWeeklyPlan | null>(null);
  const [supportingEvidence, setSupportingEvidence] = useState<
    ReportSupportingEvidenceItem[]
  >([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const weekKey = useMemo(() => getCurrentWeekKey(), []);
  const draftId = safe(searchParams.get("draftId"));
  const builderHref = useMemo(
    () => (draftId ? `/reports?draftId=${encodeURIComponent(draftId)}` : "/reports"),
    [draftId],
  );

  async function handleDownloadPdf() {
    if (!draftId || downloadingPdf) return;

    try {
      setDownloadingPdf(true);
      setPdfError("");

      const sessionResponse = await supabase.auth.getSession();
      const accessToken = safe(sessionResponse.data.session?.access_token);
      if (!accessToken) {
        throw new Error("You need to be signed in to download this PDF.");
      }

      const response = await fetch(`/api/reports/pdf?draftId=${encodeURIComponent(draftId)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        let message = "Failed to generate report PDF.";
        try {
          const payload = await response.json();
          message = safe(payload?.error) || message;
        } catch {
          // ignore non-json failures
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const disposition = safe(response.headers.get("content-disposition"));
      const filenameMatch = disposition.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] || "report.pdf";
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      setPdfError(String(err?.message || err || "Failed to generate report PDF."));
    } finally {
      setDownloadingPdf(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function hydrateDraft() {
      if (!draftId) {
        if (mounted) {
          setDraft(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");
        const nextDraft = await loadReportDraftById(draftId);
        if (!mounted) return;
        setDraft(nextDraft);
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err || "Failed to load report output."));
        setDraft(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrateDraft();
    return () => {
      mounted = false;
    };
  }, [draftId]);

  useEffect(() => {
    const learnerId = safe(draft?.student_id || draft?.child_id);
    if (!learnerId) return;
    if (learnerId === activeLearnerId) return;
    void setActiveLearner(learnerId);
  }, [activeLearnerId, draft?.child_id, draft?.student_id, setActiveLearner]);

  useEffect(() => {
    let mounted = true;

    async function hydrateSummaries() {
      const learnerId = safe(draft?.student_id || draft?.child_id);
      if (
        !learnerId ||
        !workspace.profile?.id ||
        safe(workspace.profile.id) === "local"
      ) {
        if (mounted) {
          setCurriculumData(null);
          setPlannerData(null);
        }
        return;
      }

      try {
        const [nextCurriculum, nextPlanner] = await Promise.all([
          loadLearnerCurriculumPageData({
            studentId: learnerId,
            familyPreferences: workspace.profile.curriculum_preferences,
          }),
          loadFamilyWeeklyPlan({
            familyProfileId: workspace.profile.id,
            studentId: learnerId,
            weekKey,
          }),
        ]);

        if (!mounted) return;
        setCurriculumData(nextCurriculum);
        setPlannerData(nextPlanner);
      } catch (err) {
        if (!mounted) return;
        console.error("reports output summary hydrate failed", err);
        setCurriculumData(null);
        setPlannerData(null);
      }
    }

    void hydrateSummaries();
    return () => {
      mounted = false;
    };
  }, [draft?.child_id, draft?.student_id, weekKey, workspace.profile]);

  useEffect(() => {
    let mounted = true;

    async function hydrateSupportingEvidence() {
      const evidenceIds = draft?.selected_evidence_ids ?? [];
      const learnerId = safe(draft?.student_id || draft?.child_id);

      if (!evidenceIds.length || !learnerId) {
        if (mounted) setSupportingEvidence([]);
        return;
      }

      try {
        const nextEvidence = await loadReportSupportingEvidence({
          evidenceIds,
          studentId: learnerId,
          limit: 4,
        });

        if (!mounted) return;
        setSupportingEvidence(nextEvidence);
      } catch (err) {
        if (!mounted) return;
        console.error("reports output supporting evidence hydrate failed", err);
        setSupportingEvidence([]);
      }
    }

    void hydrateSupportingEvidence();
    return () => {
      mounted = false;
    };
  }, [draft?.child_id, draft?.selected_evidence_ids, draft?.student_id]);

  const selectedStudentId = safe(draft?.student_id || draft?.child_id);
  const studentLabel = learnerLabel({
    draft,
    workspaceLearners: workspace.learners.map((learner) => ({
      id: learner.id,
      label: learner.label,
    })),
  });

  const selectedEvidenceIds = draft?.selected_evidence_ids ?? [];
  const marketOverlay = useMemo(
    () =>
      buildReportDocumentOverlay(
        draft?.preferred_market || workspace.profile?.preferred_market,
      ),
    [draft?.preferred_market, workspace.profile?.preferred_market],
  );
  const selectedCoreCount = useMemo(
    () =>
      selectedEvidenceIds.filter(
        (id) => draft?.selection_meta?.[id]?.role !== "appendix",
      ).length,
    [draft?.selection_meta, selectedEvidenceIds],
  );
  const selectedAppendixCount = useMemo(
    () =>
      selectedEvidenceIds.filter(
        (id) => draft?.selection_meta?.[id]?.role === "appendix",
      ).length,
    [draft?.selection_meta, selectedEvidenceIds],
  );

  const curriculumCoverage = useMemo(
    () => buildCurriculumCoverage({ selectedStudentId, curriculumData }),
    [curriculumData, selectedStudentId],
  );

  const readinessScore = useMemo(
    () =>
      buildReportReadinessScore({
        selectedStudentId,
        curriculumCoverage,
        plannerActionCount: plannerData?.actions.length ?? 0,
        selectedAreasCount: draft?.selected_areas?.length ?? 0,
        selectedEvidenceCount: selectedEvidenceIds.length,
        selectedCoreCount,
        selectedAppendixCount,
        includeAppendix: Boolean(draft?.include_appendix),
        includeReadinessNotes: Boolean(draft?.include_readiness_notes),
        notesText: draft?.notes ?? "",
        draftId: draft?.id ?? "",
        reportMode: draft?.report_mode ?? "family-summary",
      }),
    [
      curriculumCoverage,
      draft?.id,
      draft?.include_appendix,
      draft?.include_readiness_notes,
      draft?.notes,
      draft?.report_mode,
      draft?.selected_areas?.length,
      plannerData?.actions.length,
      selectedAppendixCount,
      selectedCoreCount,
      selectedEvidenceIds.length,
      selectedStudentId,
    ],
  );

  const readiness = useMemo(() => interpretReadiness(readinessScore), [readinessScore]);

  const parentLanguage = useMemo(
    () =>
      buildParentLanguageSummary({
        selectedStudentId,
        curriculumCoverage,
        studentEvidenceCount: selectedEvidenceIds.length,
        selectedEvidenceCount: selectedEvidenceIds.length,
        notesText: draft?.notes ?? "",
        draftId: draft?.id ?? "",
      }),
    [
      curriculumCoverage,
      draft?.id,
      draft?.notes,
      selectedEvidenceIds.length,
      selectedStudentId,
    ],
  );

  const strongestAreas = curriculumCoverage.strongestAreas.slice(0, 3);
  const planningAheadAreas = curriculumCoverage.planningAheadAreas.slice(0, 3);
  const evidenceAheadAreas = curriculumCoverage.evidenceAheadAreas.slice(0, 3);
  const weakestAreas = curriculumCoverage.weakestAreas.slice(0, 3);
  const selectedAreas = draft?.selected_areas ?? [];
  const hasMeaningfulCoverage =
    curriculumCoverage.ready &&
    (curriculumCoverage.plannedOutcomes > 0 || curriculumCoverage.linkedOutcomes > 0);
  const coverageExplanation = buildCoverageExplanation(curriculumCoverage);

  if (loading) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={h2Style}>Loading report output...</div>
          <div style={bodyStyle}>
            Pulling together the saved draft and canonical family signals now.
          </div>
        </section>
      </main>
    );
  }

  if (workspaceError || error) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={h2Style}>Report output is not available yet</div>
          <div style={bodyStyle}>
            {error || workspaceError || "The canonical report output could not be loaded."}
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/reports" style={{ color: "#2563eb", fontWeight: 900 }}>
              Return to the report hub
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!draftId) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={h2Style}>No report draft selected</div>
          <div style={bodyStyle}>
            There is not enough canonical report context yet to prepare a finished
            report output. Return to the report hub to build or select a saved draft
            first.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/reports" style={{ color: "#2563eb", fontWeight: 900 }}>
              Return to /reports
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!draft) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={h2Style}>Draft not found</div>
          <div style={bodyStyle}>
            This report draft could not be found or is not available to the current
            signed-in user.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/reports" style={{ color: "#2563eb", fontWeight: 900 }}>
              Return to /reports
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!selectedStudentId) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={h2Style}>No learner is attached to this draft yet</div>
          <div style={bodyStyle}>
            There is not enough canonical learner context to produce a trustworthy
            report output. Return to the report hub and save the draft against a
            learner first so this document can be prepared properly.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle} className="reports-output-page">
      <style jsx global>{`
        @page {
          size: auto;
          margin: 14mm 12mm;
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
          }

          .reports-output-page {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 14px !important;
          }

          .reports-output-card {
            border: 1px solid #d7dee8 !important;
            box-shadow: none !important;
            border-radius: 10px !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .reports-output-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .reports-output-evidence-item {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .reports-output-grid-two,
          .reports-output-grid-three,
          .reports-output-grid-four,
          .reports-output-metadata-grid {
            display: block !important;
          }

          .reports-output-grid-two > *,
          .reports-output-grid-three > *,
          .reports-output-grid-four > *,
          .reports-output-metadata-grid > * {
            margin-bottom: 12px !important;
          }

          .reports-output-print-actions {
            display: none !important;
          }

          a {
            color: inherit !important;
            text-decoration: none !important;
          }
        }
      `}</style>
      <section
        style={{ ...cardStyle, padding: 0, overflow: "hidden" }}
        className="reports-output-card reports-output-section"
      >
        <div
          style={{
            height: 8,
            background:
              "linear-gradient(90deg, #0f172a 0%, #3b82f6 45%, #34d399 100%)",
          }}
        />
        <div
          style={{
            padding: 28,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ maxWidth: 780 }}>
            <div style={labelStyle}>{marketOverlay.reportEyebrow}</div>
            <h1 style={h1Style}>{safe(draft.title) || "Learning Report"}</h1>
            <div style={{ ...bodyStyle, marginTop: 8, maxWidth: 720 }}>
              {marketOverlay.reportSubtitle}
            </div>
            <div
              style={{
                ...smallStyle,
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              {marketOverlay.preparedLinePrefix}{" "}
              <strong style={{ color: "#0f172a" }}>{studentLabel}</strong>
              {" • "}
              {modeLabel(draft.report_mode)}
              {" • "}
              {periodLabel(draft.period_mode)}
            </div>
            <div
              className="reports-output-metadata-grid"
              style={{ ...metadataGridStyle, marginTop: 18 }}
            >
              <div style={statStyle}>
                <div style={labelStyle}>Learner</div>
                <div style={h3Style}>{studentLabel}</div>
              </div>
              <div style={statStyle}>
                <div style={labelStyle}>Report mode</div>
                <div style={h3Style}>{modeLabel(draft.report_mode)}</div>
              </div>
              <div style={statStyle}>
                <div style={labelStyle}>{marketOverlay.periodLabel}</div>
                <div style={h3Style}>{periodLabel(draft.period_mode)}</div>
              </div>
              <div style={statStyle}>
                <div style={labelStyle}>{marketOverlay.marketLabelText}</div>
                <div style={h3Style}>
                  {marketLabel(draft.preferred_market || workspace.profile?.preferred_market)}
                </div>
              </div>
            </div>
            <div style={{ ...smallStyle, marginTop: 12 }}>
              Viewed {shortDate(new Date().toISOString())} {" • "} Updated{" "}
              {shortDate(draft.updated_at || draft.created_at)} {" • "} Draft reference{" "}
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {draft.id}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, justifyItems: "start" }}>
            <div className="reports-output-print-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={builderHref} style={{ ...actionButtonStyle, textDecoration: "none" }}>
                Return to builder
              </Link>
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                style={actionButtonStyle}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? "Preparing PDF…" : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={actionButtonStyle}
              >
                Print / Save as PDF
              </button>
            </div>
            <div className="reports-output-print-actions" style={{ ...smallStyle, maxWidth: 220 }}>
              {marketOverlay.outputRoleNote}
            </div>
            {pdfError ? (
              <div className="reports-output-print-actions" style={{ ...smallStyle, color: "#be123c", maxWidth: 260 }}>
                {pdfError}
              </div>
            ) : null}
            <span style={pillStyle(readiness.tone)}>{readiness.label}</span>
            <span style={pillStyle("secondary")}>{readinessScore}% readiness</span>
            {curriculumCoverage.ready ? (
              <span
                style={pillStyle(
                  coverageTone(
                    curriculumCoverage.plannedAndEvidencedOutcomes > 0
                      ? "strong"
                      : curriculumCoverage.linkedOutcomes > 0
                        ? "developing"
                        : "attention",
                  ),
                )}
              >
                {curriculumCoverage.plannedAndEvidencedOutcomes > 0
                  ? "Planned and evidenced"
                  : curriculumCoverage.linkedOutcomes > 0
                    ? "Evidence building"
                    : "Early coverage"}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section
        style={{ ...cardStyle, paddingTop: 22 }}
        className="reports-output-card reports-output-section"
      >
        <div style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.overview.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.overview.title}</div>
        </div>
        <div style={bodyStyle}>{parentLanguage.overall}</div>
        {draft.notes ? (
          <div style={{ ...softCardStyle, marginTop: 16 }}>
            <div style={labelStyle}>Family context note</div>
            <div style={bodyStyle}>{draft.notes}</div>
          </div>
        ) : null}
      </section>

      <section
        style={{ ...cardStyle, paddingTop: 22 }}
        className="reports-output-card reports-output-section"
      >
        <div style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.coverage.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.coverage.title}</div>
        </div>
        <div style={smallStyle}>{coverageExplanation}</div>
        <div style={{ ...smallStyle, marginTop: 8 }}>{marketOverlay.coverageNote}</div>

        <div
          className="reports-output-grid-four"
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div style={statStyle}>
            <div style={labelStyle}>Outcomes planned</div>
            <div style={h3Style}>{curriculumCoverage.plannedOutcomes}</div>
          </div>
          <div style={statStyle}>
            <div style={labelStyle}>Evidence-backed outcomes</div>
            <div style={h3Style}>{curriculumCoverage.linkedOutcomes}</div>
          </div>
          <div style={statStyle}>
            <div style={labelStyle}>Planned and evidenced</div>
            <div style={h3Style}>{curriculumCoverage.plannedAndEvidencedOutcomes}</div>
          </div>
          <div style={statStyle}>
            <div style={labelStyle}>Secure outcomes</div>
            <div style={h3Style}>{curriculumCoverage.secureOutcomes}</div>
          </div>
        </div>

        <div style={{ ...softCardStyle, marginTop: 14 }}>
          <div style={labelStyle}>Coverage interpretation</div>
          <div style={bodyStyle}>{readiness.message}</div>
        </div>
      </section>

      <section
        className="reports-output-grid-two"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <div
          style={{ ...cardStyle, paddingTop: 22 }}
          className="reports-output-card reports-output-section"
        >
          <div style={sectionHeaderStyle}>
            <div style={sectionEyebrowStyle}>{reportSectionCopy.evidenceSummary.eyebrow}</div>
            <div style={h2Style}>{reportSectionCopy.evidenceSummary.title}</div>
          </div>
          <div style={bodyStyle}>
            {selectedEvidenceIds.length
              ? `${selectedEvidenceIds.length} linked evidence item${
                  selectedEvidenceIds.length === 1 ? "" : "s"
                } are attached to this draft, including ${selectedCoreCount} core anchor${
                  selectedCoreCount === 1 ? "" : "s"
                } and ${selectedAppendixCount} appendix item${
                  selectedAppendixCount === 1 ? "" : "s"
                }.`
              : "No linked evidence is attached to this draft yet."}
          </div>
          <div style={{ ...softCardStyle, marginTop: 14 }}>
            <div style={labelStyle}>Learning focus noted in this draft</div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {selectedAreas.length
                ? selectedAreas.join(", ")
                : "No specific area focus is attached to this draft yet."}
            </div>
          </div>
        </div>

        <div
          style={{ ...cardStyle, paddingTop: 22 }}
          className="reports-output-card reports-output-section"
        >
          <div style={sectionHeaderStyle}>
            <div style={sectionEyebrowStyle}>{reportSectionCopy.strengths.eyebrow}</div>
            <div style={h2Style}>{reportSectionCopy.strengths.title}</div>
          </div>
          <div style={bodyStyle}>{parentLanguage.strengths}</div>
          <div style={{ ...softCardStyle, marginTop: 14 }}>
            <div style={labelStyle}>Strongest curriculum areas</div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {strongestAreas.length
                ? strongestAreas.join(", ")
                : "No curriculum areas are strongly supported yet."}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{ ...cardStyle, paddingTop: 22 }}
        className="reports-output-card reports-output-section"
      >
        <div style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.appendix.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.appendix.title}</div>
        </div>
        <div style={smallStyle}>{marketOverlay.appendixIntro}</div>

        {supportingEvidence.length ? (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {supportingEvidence.map((item, index) => (
              <div
                key={item.id}
                style={softCardStyle}
                className="reports-output-evidence-item"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={appendixReferenceStyle}>{formatEvidenceReference(index)}</div>
                    <div style={h3Style}>{item.title}</div>
                    <div style={{ ...smallStyle, marginTop: 4 }}>
                      {item.learningArea} {" • "} {shortDate(item.occurredOn)}
                    </div>
                  </div>

                  {item.linkedOutcomes.length ? (
                    <span style={pillStyle("info")}>
                      {item.linkedOutcomes.length} linked outcome
                      {item.linkedOutcomes.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {item.attachmentCount > 0 ? (
                    <span style={pillStyle("secondary")}>
                      {item.attachmentCount === 1
                        ? "1 attachment"
                        : `${item.attachmentCount} attachments`}
                    </span>
                  ) : null}
                </div>

                <div style={bodyStyle}>
                  {item.summary
                    ? item.summary.length > 220
                      ? `${item.summary.slice(0, 220)}...`
                      : item.summary
                    : "No written summary was saved with this evidence item."}
                </div>

                <div style={{ ...smallStyle, marginTop: 8 }}>
                  {item.linkedOutcomes.length
                    ? `Linked outcomes: ${item.linkedOutcomes
                        .map((outcome) =>
                          outcome.outcomeCode
                            ? `${outcome.outcomeCode} ${outcome.outcomeLabel}`
                            : outcome.outcomeLabel,
                        )
                        .join(" • ")}`
                    : "No linked outcome labels are available for this evidence item yet."}
                </div>
                {item.attachmentCount > 0 ? (
                  <div style={{ ...smallStyle, marginTop: 8 }}>
                    {item.attachmentLabel || "Attachment available"}
                    {item.attachmentNames.length
                      ? `: ${item.attachmentNames.join(", ")}`
                      : ""}
                  </div>
                ) : null}
                <div style={{ ...smallStyle, marginTop: 8, fontWeight: 800 }}>
                  Reference: {formatEvidenceReference(index)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...softCardStyle, marginTop: 14 }}>
            <div style={bodyStyle}>
              No supporting evidence has been linked to this report yet.
            </div>
            <div style={{ ...smallStyle, marginTop: 8 }}>
              Add linked evidence in{" "}
              <Link href="/capture" style={{ color: "#2563eb", fontWeight: 900 }}>
                /capture
              </Link>{" "}
              to strengthen this report. Linked evidence will appear here once learning
              records have been connected to curriculum outcomes.
            </div>
          </div>
        )}
      </section>

      <section
        style={{ ...cardStyle, paddingTop: 22 }}
        className="reports-output-card reports-output-section"
      >
        <div style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.nextSteps.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.nextSteps.title}</div>
        </div>
        <div style={bodyStyle}>{parentLanguage.nextStep}</div>

        <div
          className="reports-output-grid-three"
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div style={softCardStyle}>
            <div style={labelStyle}>Planning still ahead of evidence</div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {planningAheadAreas.length
                ? planningAheadAreas.join(", ")
                : "No major planning gap is standing out yet."}
            </div>
          </div>

          <div style={softCardStyle}>
            <div style={labelStyle}>Evidence arriving ahead of planning</div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {evidenceAheadAreas.length
                ? evidenceAheadAreas.join(", ")
                : "Planning and evidence are reasonably aligned so far."}
            </div>
          </div>

          <div style={softCardStyle}>
            <div style={labelStyle}>Areas still thin</div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {weakestAreas.length
                ? weakestAreas.join(", ")
                : "No obvious zero-coverage area is standing out yet."}
            </div>
          </div>
        </div>
      </section>

      {(!curriculumCoverage.ready && curriculumCoverage.reason === "no-curriculum") ||
      (!curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes") ||
      (curriculumCoverage.ready &&
        curriculumCoverage.plannedOutcomes === 0 &&
        curriculumCoverage.linkedOutcomes === 0) ||
      (curriculumCoverage.ready && curriculumCoverage.linkedOutcomes === 0) ? (
        <section
          style={{ ...cardStyle, paddingTop: 22 }}
          className="reports-output-card reports-output-section"
        >
          <div style={sectionHeaderStyle}>
            <div style={sectionEyebrowStyle}>{reportSectionCopy.furtherDevelopment.eyebrow}</div>
            <div style={h2Style}>{reportSectionCopy.furtherDevelopment.title}</div>
          </div>
          <div style={bodyStyle}>
            {!curriculumCoverage.ready && curriculumCoverage.reason === "no-curriculum"
              ? "There is currently insufficient curriculum-linked context to build a strong report summary."
              : !curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes"
                ? "The learner's curriculum is selected, but no seeded outcomes are available yet for this level."
                : curriculumCoverage.plannedOutcomes === 0 &&
                    curriculumCoverage.linkedOutcomes === 0
                  ? "There is currently insufficient curriculum-linked planning and evidence to generate a strong report summary."
                  : "Planning is present, though evidence support remains limited in parts of the report."}
          </div>
          <div style={{ ...smallStyle, marginTop: 10 }}>
            Return to <Link href="/reports" style={{ color: "#2563eb", fontWeight: 900 }}>/reports</Link>{" "}
            to refine the draft, add planning in{" "}
            <Link href="/planner" style={{ color: "#2563eb", fontWeight: 900 }}>/planner</Link>,
            and capture more evidence in{" "}
            <Link href="/capture" style={{ color: "#2563eb", fontWeight: 900 }}>/capture</Link>.
          </div>
        </section>
      ) : null}

      <section
        style={{ ...cardStyle, paddingTop: 22 }}
        className="reports-output-card reports-output-section"
      >
        <div style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.background.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.background.title}</div>
        </div>
        <div style={smallStyle}>
          {marketOverlay.backgroundNote}
        </div>
        <div
          className="reports-output-grid-four"
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div style={statStyle}>
            <div style={labelStyle}>Tracked outcomes</div>
            <div style={h3Style}>{curriculumCoverage.trackedOutcomes}</div>
          </div>
          <div style={statStyle}>
            <div style={labelStyle}>Plan links</div>
            <div style={h3Style}>{curriculumCoverage.planLinks}</div>
          </div>
          <div style={statStyle}>
            <div style={labelStyle}>Evidence links</div>
            <div style={h3Style}>{curriculumCoverage.evidenceLinks}</div>
          </div>
          <div style={statStyle}>
            <div style={labelStyle}>Weekly plan actions</div>
            <div style={h3Style}>{plannerData?.actions.length ?? 0}</div>
          </div>
        </div>
        {!hasMeaningfulCoverage ? (
          <div style={{ ...softCardStyle, marginTop: 14 }}>
            <div style={bodyStyle}>
              There is not enough information yet to build a fuller report. Add
              planning in{" "}
              <Link href="/planner" style={{ color: "#2563eb", fontWeight: 900 }}>
                /planner
              </Link>{" "}
              and evidence in{" "}
              <Link href="/capture" style={{ color: "#2563eb", fontWeight: 900 }}>
                /capture
              </Link>{" "}
              to strengthen this report.
            </div>
          </div>
        ) : null}
      </section>

      <section
        style={{
          ...cardStyle,
          paddingTop: 18,
          paddingBottom: 18,
          background: "#fcfcfd",
        }}
        className="reports-output-card reports-output-section"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div style={labelStyle}>{reportSectionCopy.end.title}</div>
            <div style={{ ...smallStyle, color: "#475569" }}>
              {marketOverlay.endNote} Available on {shortDate(new Date().toISOString())}.
            </div>
          </div>
          <div style={{ ...smallStyle, textAlign: "right" }}>
            Prepared from canonical family records
            <br />
            Reference {draft.id}
          </div>
        </div>
      </section>
    </main>
  );
}

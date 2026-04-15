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
  buildReportExportPackCopy,
  buildCurriculumCoverage,
  formatEvidenceReference,
  getAuCompliancePhrases,
  getReportComplianceContext,
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

function naturalList(values: string[]) {
  const items = values.map((value) => safe(value)).filter(Boolean);
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
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
  const [downloadingPack, setDownloadingPack] = useState(false);
  const [packError, setPackError] = useState("");

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

  async function handleDownloadSubmissionPack() {
    if (!draftId || downloadingPack) return;

    try {
      setDownloadingPack(true);
      setPackError("");

      const sessionResponse = await supabase.auth.getSession();
      const accessToken = safe(sessionResponse.data.session?.access_token);
      if (!accessToken) {
        throw new Error("You need to be signed in to download this submission pack.");
      }

      const response = await fetch(
        `/api/reports/submission-pack?draftId=${encodeURIComponent(draftId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        let message = "Failed to generate submission pack.";
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
      const filename = filenameMatch?.[1] || "submission-pack.zip";
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      setPackError(String(err?.message || err || "Failed to generate submission pack."));
    } finally {
      setDownloadingPack(false);
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
  const complianceContext = useMemo(
    () =>
      getReportComplianceContext({
        market: draft?.preferred_market || workspace.profile?.preferred_market,
        curriculumPreferences: workspace.profile?.curriculum_preferences ?? null,
      }),
    [
      draft?.preferred_market,
      workspace.profile?.curriculum_preferences,
      workspace.profile?.preferred_market,
    ],
  );
  const compliancePhrases = useMemo(
    () => getAuCompliancePhrases(complianceContext.state),
    [complianceContext.state],
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
  const exportPackCopy = useMemo(
    () =>
      buildReportExportPackCopy({
        complianceContext,
        hasMeaningfulCoverage,
        selectedEvidenceCount: selectedEvidenceIds.length,
        selectedAreasCount: selectedAreas.length,
        includeAppendix: Boolean(draft?.include_appendix),
        supportingEvidenceCount: supportingEvidence.length,
      }),
    [
      complianceContext,
      draft?.include_appendix,
      hasMeaningfulCoverage,
      selectedAreas.length,
      selectedEvidenceIds.length,
      supportingEvidence.length,
    ],
  );
  const coverageExplanation = buildCoverageExplanation(curriculumCoverage);
  const outputStatus = useMemo(() => {
    if (!selectedEvidenceIds.length) {
      return { label: "Building evidence base", tone: "warning" as const };
    }
    if (!hasMeaningfulCoverage) {
      return { label: "Picture still forming", tone: "secondary" as const };
    }
    if (readinessScore >= 85) {
      return { label: "Grounded summary", tone: "success" as const };
    }
    if (readinessScore >= 65) {
      return { label: "Useful working draft", tone: "info" as const };
    }
    return { label: "Early summary", tone: "warning" as const };
  }, [hasMeaningfulCoverage, readinessScore, selectedEvidenceIds.length]);
  const evidenceBaseSummary = useMemo(() => {
    if (!selectedEvidenceIds.length) {
      return "This draft is still forming around a very small evidence base.";
    }
    const pieces = `${selectedEvidenceIds.length} selected evidence item${
      selectedEvidenceIds.length === 1 ? "" : "s"
    }`;
    const coreSummary = selectedCoreCount
      ? `${selectedCoreCount} core anchor${selectedCoreCount === 1 ? "" : "s"}`
      : "no clear core anchors yet";
    const appendixSummary = selectedAppendixCount
      ? `${selectedAppendixCount} appendix item${selectedAppendixCount === 1 ? "" : "s"}`
      : "no appendix items yet";

    return hasMeaningfulCoverage
      ? `This summary currently draws on ${pieces}, including ${coreSummary} and ${appendixSummary}.`
      : `This draft currently includes ${pieces}, with ${coreSummary} and ${appendixSummary}.`;
  }, [
    hasMeaningfulCoverage,
    selectedAppendixCount,
    selectedCoreCount,
    selectedEvidenceIds.length,
  ]);
  const overviewSupportNote = useMemo(() => {
    if (!selectedEvidenceIds.length) {
      return "The learning picture is only just beginning. A few well-chosen examples will make the report easier to trust.";
    }
    if (!hasMeaningfulCoverage) {
      return "The story is starting to show, but a little more linked planning and evidence will make it clearer and steadier.";
    }
    if (selectedCoreCount < 2) {
      return "The learning story is visible now, and a couple of clear anchors will make it easier to follow.";
    }
    return "The current summary is grounded in visible evidence and curriculum links, so it reads as a connected picture rather than a loose set of notes.";
  }, [hasMeaningfulCoverage, selectedCoreCount, selectedEvidenceIds.length]);
  const coverageInterpretationText = useMemo(() => {
    if (!curriculumCoverage.ready && curriculumCoverage.reason === "no-curriculum") {
      return "Curriculum context is still being set up, so this section can only show an early picture of learning so far.";
    }
    if (!curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes") {
      return "The curriculum path is chosen, but the outcome map is still taking shape. More structure here will make the report clearer.";
    }
    if (!hasMeaningfulCoverage) {
      return "This section is beginning to take shape. More linked planning and evidence will make the coverage picture clearer over time.";
    }
    return readiness.message;
  }, [curriculumCoverage, hasMeaningfulCoverage, readiness.message]);
  const strengthsSupportText = useMemo(() => {
    if (strongestAreas.length) {
      return `Current evidence feels most settled in ${naturalList(strongestAreas)}.`;
    }
    if (hasMeaningfulCoverage) {
      return "Some areas are starting to read as steadier than others, even if no single area is dominant yet.";
    }
    return "Strengths will read more clearly once a few more linked examples are in place.";
  }, [hasMeaningfulCoverage, strongestAreas]);
  const appendixLead = useMemo(() => {
    if (supportingEvidence.length) {
      return "These records show the learning moments currently supporting the summary above.";
    }
    return "Supporting records will appear here as more linked evidence is added to the draft.";
  }, [supportingEvidence.length]);
  const evidenceSummaryLead = useMemo(() => {
    if (!selectedEvidenceIds.length) {
      return "The report is still waiting on a clearer evidence base before the learning story can feel settled.";
    }
    if (!hasMeaningfulCoverage) {
      return "The draft already has material to work from, though the overall picture is still modest and building.";
    }
    return "The selected evidence gives this report a clear base to read from, especially where the strongest anchors are already visible.";
  }, [hasMeaningfulCoverage, selectedEvidenceIds.length]);
  const nextStepsLead = useMemo(() => {
    if (!hasMeaningfulCoverage) {
      return "The next useful step is to keep building the record gently so the report grows clearer from real examples.";
    }
    return parentLanguage.nextStep;
  }, [hasMeaningfulCoverage, parentLanguage.nextStep]);
  const furtherDevelopmentText = useMemo(() => {
    if (!curriculumCoverage.ready && curriculumCoverage.reason === "no-curriculum") {
      return "This report is still waiting on curriculum context, so the learning picture can only stay broad for now.";
    }
    if (!curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes") {
      return "The learner's curriculum path is chosen, but the outcomes for this level are still not in place yet.";
    }
    if (curriculumCoverage.plannedOutcomes === 0 && curriculumCoverage.linkedOutcomes === 0) {
      return "This report is still at an early stage. More linked planning and evidence will help the picture feel clearer and more useful.";
    }
    return "Planning is visible, though some parts of the report still need stronger evidence support to feel settled.";
  }, [curriculumCoverage]);
  const backgroundLead = useMemo(() => {
    if (!hasMeaningfulCoverage) {
      return "This background shows the early structure behind the report, even while the fuller picture is still forming.";
    }
    return "This background shows how much of the report is already grounded in tracked outcomes, planning links, and evidence links.";
  }, [hasMeaningfulCoverage]);

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
            background: #ffffff !important;
          }

          .reports-output-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .reports-output-section-header {
            break-after: avoid;
            page-break-after: avoid;
          }

          .reports-output-keep-with-next {
            break-after: avoid;
            page-break-after: avoid;
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

          .reports-output-screen-status {
            display: none !important;
          }

          .reports-output-print-note {
            display: block !important;
          }

          .reports-output-page h1 {
            font-size: 28px !important;
            line-height: 1.15 !important;
          }

          .reports-output-page h2 {
            font-size: 19px !important;
            line-height: 1.2 !important;
          }

          .reports-output-page h3 {
            font-size: 15px !important;
            line-height: 1.3 !important;
          }

          .reports-output-hero-bar {
            height: 4px !important;
            background: #cbd5e1 !important;
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
          className="reports-output-hero-bar"
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
            {complianceContext.isAU ? (
              <div style={{ ...smallStyle, marginTop: 10, maxWidth: 720 }}>
                {compliancePhrases.subtitle}
              </div>
            ) : null}
            {exportPackCopy ? (
              <div style={{ ...smallStyle, marginTop: 10, maxWidth: 720, color: "#475569" }}>
                {exportPackCopy.headerFraming}
              </div>
            ) : null}
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
              {shortDate(draft.updated_at || draft.created_at)} {" • "}{" "}
              {exportPackCopy?.referenceLabel || "Draft reference"}{" "}
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {draft.id}
              </span>
            </div>
            <div
              className="reports-output-print-note"
              style={{ ...smallStyle, marginTop: 10, display: "none", color: "#475569" }}
            >
              Formatted for printing or saving as a family report.
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
                {downloadingPdf
                  ? "Preparing PDF..."
                  : exportPackCopy
                    ? "Download report PDF"
                    : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadSubmissionPack()}
                style={actionButtonStyle}
                disabled={downloadingPack}
              >
                {downloadingPack
                  ? "Preparing pack..."
                  : exportPackCopy
                    ? "Download report pack"
                    : "Download Submission Pack"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={actionButtonStyle}
              >
                {exportPackCopy ? "Print or save PDF" : "Print / Save as PDF"}
              </button>
            </div>
            <div className="reports-output-print-actions" style={{ ...smallStyle, maxWidth: 220 }}>
              {exportPackCopy?.actionFraming || marketOverlay.outputRoleNote}
            </div>
            {exportPackCopy ? (
              <div
                className="reports-output-print-actions"
                style={{ ...smallStyle, maxWidth: 260 }}
              >
                {marketOverlay.outputRoleNote}
              </div>
            ) : null}
            {!exportPackCopy ? (
              <div className="reports-output-print-actions" style={{ ...smallStyle, maxWidth: 220 }}>
                {marketOverlay.outputRoleNote}
              </div>
            ) : null}
            {pdfError ? (
              <div className="reports-output-print-actions" style={{ ...smallStyle, color: "#be123c", maxWidth: 260 }}>
                {pdfError}
              </div>
            ) : null}
            {packError ? (
              <div className="reports-output-print-actions" style={{ ...smallStyle, color: "#be123c", maxWidth: 260 }}>
                {packError}
              </div>
            ) : null}
            <span className="reports-output-screen-status" style={pillStyle(outputStatus.tone)}>
              {outputStatus.label}
            </span>
            {hasMeaningfulCoverage ? (
              <span className="reports-output-screen-status" style={pillStyle(readiness.tone)}>
                {readiness.label}
              </span>
            ) : null}
            {curriculumCoverage.ready ? (
              <span
                className="reports-output-screen-status"
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
        <div className="reports-output-section-header" style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.overview.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.overview.title}</div>
        </div>
        <div className="reports-output-keep-with-next" style={bodyStyle}>{parentLanguage.overall}</div>
        {exportPackCopy ? (
          <div className="reports-output-keep-with-next" style={{ ...softCardStyle, marginTop: 16 }}>
            <div style={labelStyle}>{exportPackCopy.includedHeading}</div>
            <div style={bodyStyle}>{exportPackCopy.includedSummary}</div>
          </div>
        ) : null}
        <div className="reports-output-keep-with-next" style={{ ...softCardStyle, marginTop: 16 }}>
          <div style={labelStyle}>What this summary is drawing from</div>
          <div style={bodyStyle}>{evidenceBaseSummary}</div>
          <div style={{ ...smallStyle, marginTop: 8 }}>{overviewSupportNote}</div>
        </div>
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
        <div className="reports-output-section-header" style={sectionHeaderStyle}>
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

        <div className="reports-output-keep-with-next" style={{ ...softCardStyle, marginTop: 14 }}>
          <div style={labelStyle}>Current picture</div>
          <div style={bodyStyle}>{coverageInterpretationText}</div>
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
        <div className="reports-output-section-header" style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.evidenceSummary.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.evidenceSummary.title}</div>
        </div>
        {complianceContext.isAU ? (
          <div style={smallStyle}>{compliancePhrases.evidenceSummaryFraming}</div>
        ) : null}
        <div style={bodyStyle}>{evidenceSummaryLead}</div>
          <div style={{ ...softCardStyle, marginTop: 14 }}>
            <div style={labelStyle}>Evidence base in this draft</div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>{evidenceBaseSummary}</div>
          </div>
        <div style={{ ...softCardStyle, marginTop: 14 }}>
          <div style={labelStyle}>
            {complianceContext.isAU
              ? compliancePhrases.learningAreasLabel
              : "Learning focus noted here"}
          </div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {selectedAreas.length
                ? selectedAreas.join(", ")
                : "No specific learning area focus is attached to this draft yet."}
            </div>
          </div>
        </div>

        <div
          style={{ ...cardStyle, paddingTop: 22 }}
          className="reports-output-card reports-output-section"
        >
          <div className="reports-output-section-header" style={sectionHeaderStyle}>
            <div style={sectionEyebrowStyle}>{reportSectionCopy.strengths.eyebrow}</div>
            <div style={h2Style}>{reportSectionCopy.strengths.title}</div>
          </div>
          <div style={bodyStyle}>{parentLanguage.strengths}</div>
          <div style={{ ...smallStyle, marginTop: 8 }}>{strengthsSupportText}</div>
          <div style={{ ...softCardStyle, marginTop: 14 }}>
            <div style={labelStyle}>Strongest curriculum areas</div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {strongestAreas.length
                ? strongestAreas.join(", ")
                : "No area stands out strongly yet, though the picture is beginning to form."}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{ ...cardStyle, paddingTop: 22 }}
        className="reports-output-card reports-output-section"
      >
        <div className="reports-output-section-header" style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.appendix.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.appendix.title}</div>
        </div>
        <div style={smallStyle}>{marketOverlay.appendixIntro}</div>
        {complianceContext.isAU ? (
          <div style={{ ...smallStyle, marginTop: 8 }}>
            {compliancePhrases.appendixFraming}
          </div>
        ) : null}
        {exportPackCopy ? (
          <div style={{ ...smallStyle, marginTop: 8 }}>{exportPackCopy.appendixFraming}</div>
        ) : null}
        <div style={{ ...bodyStyle, marginTop: 10 }}>{appendixLead}</div>

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
                    : "No written note was saved with this evidence item yet."}
                </div>

                <div style={{ ...smallStyle, marginTop: 8 }}>
                  {item.linkedOutcomes.length
                    ? `${complianceContext.isAU ? compliancePhrases.observedOutcomesLabel : "Linked outcomes"}: ${item.linkedOutcomes
                        .map((outcome) =>
                          outcome.outcomeCode
                            ? `${outcome.outcomeCode} ${outcome.outcomeLabel}`
                            : outcome.outcomeLabel,
                        )
                        .join(" • ")}`
                    : "Outcome labels have not been linked here yet."}
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
        <div className="reports-output-section-header" style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.nextSteps.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.nextSteps.title}</div>
        </div>
        <div style={bodyStyle}>{nextStepsLead}</div>

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
                : "No major planning gap is standing out right now."}
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
                : "No obvious thin area is standing out right now."}
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
          <div className="reports-output-section-header" style={sectionHeaderStyle}>
            <div style={sectionEyebrowStyle}>{reportSectionCopy.furtherDevelopment.eyebrow}</div>
            <div style={h2Style}>{reportSectionCopy.furtherDevelopment.title}</div>
          </div>
          <div style={bodyStyle}>{furtherDevelopmentText}</div>
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
        <div className="reports-output-section-header" style={sectionHeaderStyle}>
          <div style={sectionEyebrowStyle}>{reportSectionCopy.background.eyebrow}</div>
          <div style={h2Style}>{reportSectionCopy.background.title}</div>
        </div>
        <div style={smallStyle}>
          {marketOverlay.backgroundNote}
        </div>
        <div style={{ ...bodyStyle, marginTop: 10 }}>{backgroundLead}</div>
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
            <div style={labelStyle}>
              {complianceContext.isAU
                ? compliancePhrases.evidenceLinksLabel
                : "Evidence links"}
            </div>
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
              The report is still building its base. Add planning in{" "}
              <Link href="/planner" style={{ color: "#2563eb", fontWeight: 900 }}>
                /planner
              </Link>{" "}
              and evidence in{" "}
              <Link href="/capture" style={{ color: "#2563eb", fontWeight: 900 }}>
                /capture
              </Link>{" "}
              to make the picture clearer over time.
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



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
  buildCurriculumCoverage,
  buildParentLanguageSummary,
  buildReportReadinessScore,
  coverageTone,
  interpretReadiness,
} from "@/lib/reportPresentation";

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

  const weekKey = useMemo(() => getCurrentWeekKey(), []);
  const draftId = safe(searchParams.get("draftId"));

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

  const selectedStudentId = safe(draft?.student_id || draft?.child_id);
  const studentLabel = learnerLabel({
    draft,
    workspaceLearners: workspace.learners.map((learner) => ({
      id: learner.id,
      label: learner.label,
    })),
  });

  const selectedEvidenceIds = draft?.selected_evidence_ids ?? [];
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
  const coverageExplanation = !curriculumCoverage.ready
    ? "Curriculum coverage will appear here once the learner has a linked curriculum setup and seeded outcomes."
    : curriculumCoverage.plannedAndEvidencedOutcomes > 0
      ? "This report already shows areas where planned learning and captured evidence are lining up well."
      : curriculumCoverage.plannedOutcomes > 0 && curriculumCoverage.linkedOutcomes === 0
        ? "Planning is visible, but evidence still needs to catch up before the report feels fully supported."
        : curriculumCoverage.linkedOutcomes > 0 && curriculumCoverage.plannedOutcomes === 0
          ? "Evidence is present, though some of it is arriving before planning has been linked clearly."
          : "Coverage is still early and building.";

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
            There is not enough canonical report context yet to build an output page.
            Return to the report hub to build or select a saved draft first.
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
            learner first.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ maxWidth: 780 }}>
            <div style={labelStyle}>Learning report</div>
            <h1 style={h1Style}>{safe(draft.title) || "Learning Report"}</h1>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {studentLabel} · {modeLabel(draft.report_mode)} ·{" "}
              {periodLabel(draft.period_mode)} · {marketLabel(draft.preferred_market)}
            </div>
            <div style={{ ...smallStyle, marginTop: 8 }}>
              Updated {shortDate(draft.updated_at || draft.created_at)} · Draft ID{" "}
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {draft.id}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, justifyItems: "start" }}>
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

      <section style={cardStyle}>
        <div style={h2Style}>Learning Overview</div>
        <div style={bodyStyle}>{parentLanguage.overall}</div>
        {draft.notes ? (
          <div style={{ ...softCardStyle, marginTop: 16 }}>
            <div style={labelStyle}>Family note</div>
            <div style={bodyStyle}>{draft.notes}</div>
          </div>
        ) : null}
      </section>

      <section style={cardStyle}>
        <div style={h2Style}>Curriculum Coverage</div>
        <div style={smallStyle}>{coverageExplanation}</div>

        <div
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
          <div style={labelStyle}>Coverage summary</div>
          <div style={bodyStyle}>{readiness.message}</div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <div style={cardStyle}>
          <div style={h2Style}>Evidence of Learning</div>
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
            <div style={labelStyle}>Current focus areas</div>
            <div style={{ ...bodyStyle, marginTop: 8 }}>
              {selectedAreas.length
                ? selectedAreas.join(", ")
                : "No specific area focus is attached to this draft yet."}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={h2Style}>Strengths</div>
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

      <section style={cardStyle}>
        <div style={h2Style}>Next Steps</div>
        <div style={bodyStyle}>{parentLanguage.nextStep}</div>

        <div
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
        <section style={cardStyle}>
          <div style={h2Style}>What Is Still Missing</div>
          <div style={bodyStyle}>
            {!curriculumCoverage.ready && curriculumCoverage.reason === "no-curriculum"
              ? "There is not enough curriculum-linked context yet to build a strong report output."
              : !curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes"
                ? "The learner's curriculum is selected, but no seeded outcomes are available yet for this level."
                : curriculumCoverage.plannedOutcomes === 0 &&
                    curriculumCoverage.linkedOutcomes === 0
                  ? "There is not enough curriculum-linked planning and evidence yet to build a strong report output."
                  : "Planning exists, but evidence support is still limited."}
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

      <section style={cardStyle}>
        <div style={h2Style}>Report Context</div>
        <div style={smallStyle}>
          This section keeps the underlying report inputs visible without turning the
          page into a dashboard.
        </div>
        <div
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
    </main>
  );
}

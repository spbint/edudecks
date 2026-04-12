"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  loadLearnerCurriculumPageData,
  updateLearnerOutcomeStatus,
  type LearnerCurriculumPageData,
  type LearnerOutcomeStatusKey,
} from "@/lib/familyCurriculum";

const STATUS_OPTIONS: Array<{
  value: LearnerOutcomeStatusKey;
  label: string;
}> = [
  { value: "not_introduced", label: "Not introduced" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "assessed", label: "Assessed" },
  { value: "secure", label: "Secure" },
  { value: "needs_review", label: "Needs review" },
];

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function statusLabel(value: LearnerOutcomeStatusKey) {
  return STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function chipColors(status: LearnerOutcomeStatusKey) {
  if (status === "secure") {
    return { bg: "#ecfdf5", border: "#86efac", text: "#166534" };
  }
  if (status === "assessed") {
    return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
  }
  if (status === "in_progress") {
    return { bg: "#fffbeb", border: "#fde68a", text: "#92400e" };
  }
  if (status === "planned") {
    return { bg: "#f8fafc", border: "#cbd5e1", text: "#334155" };
  }
  if (status === "needs_review") {
    return { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" };
  }
  return { bg: "#ffffff", border: "#e5e7eb", text: "#64748b" };
}

function EmptyState({
  title,
  text,
  href,
  linkLabel,
}: {
  title: string;
  text: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section style={S.emptyCard}>
      <div style={S.emptyTitle}>{title}</div>
      <div style={S.emptyText}>{text}</div>
      {href && linkLabel ? (
        <Link href={href} style={S.primaryLink}>
          {linkLabel}
        </Link>
      ) : null}
    </section>
  );
}

export default function CurriculumPage() {
  const {
    workspace,
    activeLearnerId,
    setActiveLearner,
    loading: workspaceLoading,
    error: workspaceError,
  } = useFamilyWorkspace();
  const [pageData, setPageData] = useState<LearnerCurriculumPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [savingOutcomeId, setSavingOutcomeId] = useState("");

  const learners = workspace.learners;
  const familyPreferences = workspace.profile.curriculum_preferences;
  const activeLearner =
    learners.find((learner) => learner.id === activeLearnerId) ?? learners[0] ?? null;
  const hasSelectedCurriculum =
    !!safe(pageData?.learnerProfile?.framework_id) ||
    !!safe(pageData?.learnerProfile?.level_id) ||
    (!!safe(familyPreferences.framework_id) && !!safe(familyPreferences.level_id));

  useEffect(() => {
    if (activeLearner && activeLearner.id !== activeLearnerId) {
      setActiveLearner(activeLearner.id);
    }
  }, [activeLearner, activeLearnerId, setActiveLearner]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      setLoading(true);
      setError("");

      try {
        if (!activeLearner?.id) {
          if (mounted) setPageData(null);
          return;
        }

        const next = await loadLearnerCurriculumPageData({
          studentId: activeLearner.id,
          familyPreferences,
        });

        if (!mounted) return;
        setPageData(next);
      } catch (pageError: any) {
        console.error("curriculum page hydrate failed", pageError);
        if (!mounted) return;
        setPageData(null);
        setError(
          String(pageError?.message ?? "We could not load the curriculum map right now."),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, familyPreferences]);

  async function handleStatusChange(
    outcomeId: string,
    status: LearnerOutcomeStatusKey,
  ) {
    if (!activeLearner?.id) return;
    const frameworkId =
      safe(pageData?.learnerProfile?.framework_id) || safe(familyPreferences.framework_id);
    const levelId =
      safe(pageData?.learnerProfile?.level_id) || safe(familyPreferences.level_id);

    if (!frameworkId || !levelId) {
      setError("Choose the family curriculum in settings before updating progress.");
      return;
    }

    setSavingOutcomeId(outcomeId);
    setStatusMessage("");
    setError("");

    try {
      await updateLearnerOutcomeStatus({
        studentId: activeLearner.id,
        outcomeId,
        status,
        frameworkId,
        levelId,
        jurisdiction: pageData?.learnerProfile?.jurisdiction ?? familyPreferences.region_id,
      });

      const refreshed = await loadLearnerCurriculumPageData({
        studentId: activeLearner.id,
        familyPreferences,
      });
      setPageData(refreshed);
      setStatusMessage("Learner progress updated.");
    } catch (updateError: any) {
      console.error("curriculum status update failed", updateError);
      setError(
        String(updateError?.message ?? "We could not update learner progress right now."),
      );
    } finally {
      setSavingOutcomeId("");
    }
  }

  const currentFrameworkLabel =
    pageData?.framework?.name ||
    safe(familyPreferences.compliance_profile?.curriculum_framework) ||
    "Not selected";
  const currentLevelLabel = pageData?.level?.level_label || "Not selected";

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Curriculum"
      heroTitle="See the learner’s curriculum clearly"
      heroText="Track what belongs to this learner’s framework, what has started, and what still needs gentle attention."
      heroAsideTitle="Curriculum mapper"
      heroAsideText="This is the first live curriculum map surface backed by the canonical family settings and learner mapper tables."
    >
      <div style={S.page}>
        <section style={S.topCard}>
          <div style={S.topRow}>
            <div>
              <div style={S.eyebrow}>Learner</div>
              <div style={S.topTitle}>
                {activeLearner?.label || "No learner selected"}
              </div>
              <div style={S.topText}>
                {activeLearner?.yearLabel || "Year level not set in learner profile"}
              </div>
            </div>

            <div style={S.topControls}>
              <select
                value={activeLearner?.id || ""}
                onChange={(event) => setActiveLearner(event.target.value)}
                style={S.select}
              >
                {learners.length === 0 ? (
                  <option value="">No linked learners</option>
                ) : (
                  learners.map((learner) => (
                    <option key={learner.id} value={learner.id}>
                      {learner.label}
                    </option>
                  ))
                )}
              </select>
              <Link href="/settings#curriculum" style={S.secondaryLink}>
                Open curriculum settings
              </Link>
            </div>
          </div>
        </section>

        {workspaceError ? <section style={S.warningCard}>{workspaceError}</section> : null}
        {statusMessage ? <section style={S.successCard}>{statusMessage}</section> : null}
        {error ? <section style={S.errorCard}>{error}</section> : null}

        {workspaceLoading || loading ? (
          <section style={S.card}>
            <div style={S.cardText}>Loading learner curriculum map…</div>
          </section>
        ) : !activeLearner ? (
          <EmptyState
            title="Choose a learner first"
            text="The curriculum map needs one active learner from the family workspace before it can load anything meaningful."
            href="/profile#manage-family"
            linkLabel="Manage learners"
          />
        ) : !hasSelectedCurriculum ? (
          <EmptyState
            title="Set the family curriculum first"
            text="This learner does not have a canonical framework and level to map against yet. Choose that in settings before using the curriculum page."
            href="/settings#curriculum"
            linkLabel="Open settings"
          />
        ) : !pageData?.framework || !pageData?.level ? (
          <EmptyState
            title="Curriculum tables are not ready yet"
            text="The selected framework or level could not be found in the canonical curriculum tables. Seed the mapper tables first, then return here."
          />
        ) : pageData.totalOutcomes === 0 ? (
          <EmptyState
            title="No outcomes are seeded for this framework and level"
            text="The learner’s framework is selected, but no canonical outcomes were found for this level yet."
          />
        ) : (
          <>
            <section style={S.summaryGrid}>
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Framework</div>
                <div style={S.summaryValue}>{currentFrameworkLabel}</div>
              </div>
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Level</div>
                <div style={S.summaryValue}>{currentLevelLabel}</div>
              </div>
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Total outcomes</div>
                <div style={S.summaryValue}>{pageData.totalOutcomes}</div>
              </div>
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Tracked rows</div>
                <div style={S.summaryValue}>{pageData.trackedOutcomeCount}</div>
              </div>
            </section>

            <section style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <div style={S.cardTitle}>Progress snapshot</div>
                  <div style={S.cardText}>
                    {pageData.trackedOutcomeCount > 0
                      ? "These counts come from saved learner outcome statuses."
                      : "No saved learner outcome rows exist yet. Outcomes below are currently shown as not introduced until you begin tracking."}
                  </div>
                </div>
              </div>
              <div style={S.statusGrid}>
                {STATUS_OPTIONS.map((option) => {
                  const tones = chipColors(option.value);
                  return (
                    <div key={option.value} style={{ ...S.statusCard, background: tones.bg, borderColor: tones.border }}>
                      <div style={{ ...S.statusName, color: tones.text }}>{option.label}</div>
                      <div style={S.statusCount}>{pageData.statusCounts[option.value]}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {pageData.areas.map((area) => (
              <section key={area.id} style={S.card}>
                <div style={S.areaHeader}>
                  <div>
                    <div style={S.cardTitle}>{area.name}</div>
                    <div style={S.cardText}>
                      {area.strands.length} strand{area.strands.length === 1 ? "" : "s"} · {Object.values(area.counts).reduce((sum, count) => sum + count, 0)} outcomes
                    </div>
                  </div>
                  <div style={S.countRow}>
                    {(["secure", "in_progress", "planned", "needs_review"] as LearnerOutcomeStatusKey[]).map((status) => {
                      const tones = chipColors(status);
                      return (
                        <span key={status} style={{ ...S.countChip, background: tones.bg, borderColor: tones.border, color: tones.text }}>
                          {statusLabel(status)}: {area.counts[status]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div style={S.strandStack}>
                  {area.strands.map((strand) => (
                    <div key={strand.id} style={S.strandCard}>
                      <div style={S.strandTitle}>{strand.name}</div>
                      <div style={S.outcomeStack}>
                        {strand.outcomes.map((outcome) => {
                          const tones = chipColors(outcome.status);
                          return (
                            <div key={outcome.id} style={S.outcomeRow}>
                              <div style={S.outcomeCopy}>
                                <div style={S.outcomeCode}>{outcome.code || "Outcome"}</div>
                                <div style={S.outcomeText}>
                                  {outcome.short_label || outcome.full_text}
                                </div>
                              </div>
                              <div style={S.outcomeControls}>
                                <span style={{ ...S.countChip, background: tones.bg, borderColor: tones.border, color: tones.text }}>
                                  {statusLabel(outcome.status)}
                                </span>
                                <select
                                  value={outcome.status}
                                  onChange={(event) =>
                                    void handleStatusChange(
                                      outcome.id,
                                      event.target.value as LearnerOutcomeStatusKey,
                                    )
                                  }
                                  disabled={savingOutcomeId === outcome.id}
                                  style={S.statusSelect}
                                >
                                  {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </FamilyTopNavShell>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18, paddingBottom: 56 },
  topCard: {
    border: "1px solid #dbeafe",
    borderRadius: 22,
    background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
    padding: 20,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#64748b",
  },
  topTitle: { marginTop: 4, fontSize: 24, fontWeight: 900, color: "#0f172a" },
  topText: { marginTop: 6, fontSize: 14, color: "#475569" },
  topControls: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  select: {
    minWidth: 220,
    minHeight: 46,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    padding: "10px 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#0f172a",
  },
  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: 14,
  },
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#ffffff",
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: 14,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#ffffff",
    padding: 20,
    boxShadow: "0 10px 26px rgba(15,23,42,0.04)",
  },
  emptyCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#ffffff",
    padding: 24,
    display: "grid",
    gap: 12,
  },
  emptyTitle: { fontSize: 22, fontWeight: 900, color: "#0f172a" },
  emptyText: { fontSize: 14, lineHeight: 1.7, color: "#475569", maxWidth: 760 },
  warningCard: {
    border: "1px solid #fde68a",
    borderRadius: 18,
    background: "#fffbeb",
    color: "#92400e",
    padding: 14,
    fontSize: 14,
    fontWeight: 700,
  },
  successCard: {
    border: "1px solid #bbf7d0",
    borderRadius: 18,
    background: "#f0fdf4",
    color: "#166534",
    padding: 14,
    fontSize: 14,
    fontWeight: 700,
  },
  errorCard: {
    border: "1px solid #fdba74",
    borderRadius: 18,
    background: "#fff7ed",
    color: "#9a3412",
    padding: 14,
    fontSize: 14,
    fontWeight: 700,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 12,
  },
  summaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
    display: "grid",
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  cardHeader: { display: "grid", gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 20, fontWeight: 900, color: "#0f172a" },
  cardText: { fontSize: 14, lineHeight: 1.6, color: "#475569" },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
    gap: 10,
  },
  statusCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 6,
  },
  statusName: { fontSize: 13, fontWeight: 800 },
  statusCount: { fontSize: 24, fontWeight: 900, color: "#0f172a" },
  areaHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "start",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  countRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  countChip: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
  },
  strandStack: { display: "grid", gap: 12 },
  strandCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 16,
    display: "grid",
    gap: 12,
  },
  strandTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  outcomeStack: { display: "grid", gap: 10 },
  outcomeRow: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#ffffff",
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "start",
    flexWrap: "wrap",
  },
  outcomeCopy: { display: "grid", gap: 6, flex: "1 1 360px" },
  outcomeCode: { fontSize: 12, fontWeight: 800, color: "#64748b" },
  outcomeText: { fontSize: 14, lineHeight: 1.55, color: "#0f172a" },
  outcomeControls: { display: "grid", gap: 8, justifyItems: "end" },
  statusSelect: {
    minWidth: 170,
    minHeight: 40,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    padding: "8px 10px",
    fontSize: 13,
    background: "#ffffff",
    color: "#0f172a",
  },
};

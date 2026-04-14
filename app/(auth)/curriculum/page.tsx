"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import GuidedCompletionFeedback from "@/app/components/GuidedCompletionFeedback";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  loadLearnerCurriculumPageData,
  updateLearnerOutcomeStatus,
  type LearnerCurriculumPageData,
  type LearnerOutcomeStatusKey,
} from "@/lib/familyCurriculum";
import {
  readGuidedCompletionSnapshot,
  writeGuidedCompletionSnapshot,
} from "@/lib/guidedCompletionSnapshot";

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

function buildCurriculumGuidanceNote(focus: string) {
  const value = safe(focus).toLowerCase();
  if (value === "curriculum-setup") {
    return "This report is waiting on a clearer curriculum setup. Review the learner's framework and level here before relying on report coverage.";
  }
  if (value === "no-outcomes") {
    return "This report cannot give stronger curriculum guidance until seeded outcomes are available for the selected framework and level.";
  }
  return "";
}

function buildCurriculumSectionCue(
  focus: string,
  section: "setup" | "outcomes",
) {
  const value = safe(focus).toLowerCase();
  if (section === "setup" && value === "curriculum-setup") {
    return "Start here. Confirm the learner, framework, and level first so the rest of the curriculum map becomes meaningful.";
  }
  if (section === "outcomes" && value === "no-outcomes") {
    return "The next useful check is whether canonical outcomes exist for this framework and level. Until they do, deeper coverage targeting will stay limited.";
  }
  return "";
}

type CurriculumContinuitySnapshot = {
  hasCurriculumSetup: boolean;
  hasCurriculumOutcomes: boolean;
  hasCurriculumTracking: boolean;
};

function EmptyState({
  title,
  text,
  href,
  linkLabel,
  children,
}: {
  title: string;
  text: string;
  href?: string;
  linkLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <section style={S.emptyCard}>
      <div style={S.emptyTitle}>{title}</div>
      <div style={S.emptyText}>{text}</div>
      {children}
      {href && linkLabel ? (
        <Link href={href} style={S.primaryLink}>
          {linkLabel}
        </Link>
      ) : null}
    </section>
  );
}

export default function CurriculumPage() {
  const searchParams = useSearchParams();
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
  const curriculumFocus = safe(searchParams.get("focus"));
  const curriculumGuidanceNote = useMemo(
    () => buildCurriculumGuidanceNote(curriculumFocus),
    [curriculumFocus],
  );
  const curriculumSetupCue = useMemo(
    () => buildCurriculumSectionCue(curriculumFocus, "setup"),
    [curriculumFocus],
  );
  const curriculumOutcomesCue = useMemo(
    () => buildCurriculumSectionCue(curriculumFocus, "outcomes"),
    [curriculumFocus],
  );
  const highlightSetupSection = curriculumFocus === "curriculum-setup";
  const highlightOutcomesSection = curriculumFocus === "no-outcomes";
  const hasCurriculumSetup = Boolean(activeLearner && hasSelectedCurriculum);
  const hasCurriculumOutcomes = Boolean((pageData?.totalOutcomes ?? 0) > 0);
  const hasCurriculumTracking = Boolean((pageData?.trackedOutcomeCount ?? 0) > 0);
  const curriculumContinuitySnapshot = useMemo<CurriculumContinuitySnapshot>(
    () => ({
      hasCurriculumSetup,
      hasCurriculumOutcomes,
      hasCurriculumTracking,
    }),
    [hasCurriculumOutcomes, hasCurriculumSetup, hasCurriculumTracking],
  );
  const curriculumContinuityKey = useMemo(
    () =>
      `edudecks_guided_completion_v3_curriculum_${activeLearner?.id || "none"}_${curriculumFocus || "none"}`,
    [activeLearner?.id, curriculumFocus],
  );
  const [previousCurriculumContinuity, setPreviousCurriculumContinuity] =
    useState<CurriculumContinuitySnapshot | null>(null);
  const curriculumSetupCompletion = useMemo(() => {
    if (!highlightSetupSection) return null;

    return {
      inPlaceText: activeLearner
        ? "The learner is selected."
        : "This page is ready for a learner.",
      stillNeededText: hasCurriculumSetup
        ? "Add outcomes for deeper alignment."
        : "Finish framework setup.",
      nextStepText: hasCurriculumSetup
        ? "Use the map below."
        : "Choose the framework and level first.",
    };
  }, [activeLearner, hasCurriculumSetup, highlightSetupSection]);
  const curriculumOutcomesCompletion = useMemo(() => {
    if (!highlightOutcomesSection) return null;

    return {
      inPlaceText: hasCurriculumOutcomes
        ? "Outcomes are available here."
        : hasCurriculumSetup
          ? "Setup is already in place."
          : "This area is ready after setup.",
      stillNeededText: hasCurriculumOutcomes
        ? hasCurriculumTracking
          ? "A few areas may need attention."
          : "Tracking has not started yet."
        : hasCurriculumSetup
          ? "Add seeded outcomes."
          : "Outcome targeting still needs setup.",
      nextStepText: hasCurriculumOutcomes
        ? "Start with one or two outcomes."
        : hasCurriculumSetup
          ? "Confirm outcomes for this level."
          : "Finish setup, then come back.",
    };
  }, [
    hasCurriculumOutcomes,
    hasCurriculumSetup,
    hasCurriculumTracking,
    highlightOutcomesSection,
  ]);
  const curriculumSetupMomentum = useMemo(() => {
    if (!highlightSetupSection) return null;
    if (!activeLearner && !hasCurriculumSetup) {
      return { label: "Getting started", text: "the setup path begins here." };
    }
    return hasCurriculumSetup
      ? { label: "Taking shape", text: "the setup foundation is already there." }
      : { label: "Getting started", text: "the learner is in place now." };
  }, [activeLearner, hasCurriculumSetup, highlightSetupSection]);
  const curriculumOutcomesMomentum = useMemo(() => {
    if (!highlightOutcomesSection) return null;
    if (!hasCurriculumOutcomes) {
      return hasCurriculumSetup
        ? { label: "Getting started", text: "the setup is ready for outcomes next." }
        : { label: "Getting started", text: "setup needs one more step first." };
    }
    return hasCurriculumTracking
      ? { label: "Nearly ready", text: "this is usable for deeper alignment now." }
      : { label: "Taking shape", text: "the outcome map is beginning to settle." };
  }, [
    hasCurriculumOutcomes,
    hasCurriculumSetup,
    hasCurriculumTracking,
    highlightOutcomesSection,
  ]);
  useEffect(() => {
    if (!curriculumFocus) {
      setPreviousCurriculumContinuity(null);
      return;
    }
    setPreviousCurriculumContinuity(
      readGuidedCompletionSnapshot<CurriculumContinuitySnapshot>(
        curriculumContinuityKey,
      ),
    );
  }, [curriculumContinuityKey, curriculumFocus]);

  useEffect(() => {
    if (!curriculumFocus) return;
    writeGuidedCompletionSnapshot(
      curriculumContinuityKey,
      curriculumContinuitySnapshot,
    );
  }, [curriculumContinuityKey, curriculumContinuitySnapshot, curriculumFocus]);

  const curriculumSetupContinuity = useMemo(() => {
    if (!highlightSetupSection) return null;
    if (!previousCurriculumContinuity) {
      return hasCurriculumSetup
        ? { label: "New progress", text: "new progress since your last visit." }
        : null;
    }
    if (!previousCurriculumContinuity.hasCurriculumSetup && hasCurriculumSetup) {
      return { label: "New progress", text: "new progress since your last visit." };
    }
    if (
      !previousCurriculumContinuity.hasCurriculumOutcomes &&
      hasCurriculumOutcomes
    ) {
      return { label: "Stronger now", text: "stronger than before." };
    }
    return { label: "Not much changed yet", text: "not much has changed yet." };
  }, [
    hasCurriculumOutcomes,
    hasCurriculumSetup,
    highlightSetupSection,
    previousCurriculumContinuity,
  ]);

  const curriculumOutcomesContinuity = useMemo(() => {
    if (!highlightOutcomesSection) return null;
    if (!previousCurriculumContinuity) {
      return hasCurriculumOutcomes || hasCurriculumTracking
        ? { label: "New progress", text: "new progress since your last visit." }
        : null;
    }
    const readyNow = hasCurriculumOutcomes && hasCurriculumTracking;
    const readyBefore =
      previousCurriculumContinuity.hasCurriculumOutcomes &&
      previousCurriculumContinuity.hasCurriculumTracking;

    if (!readyBefore && readyNow) {
      return { label: "Ready to move forward", text: "now enough to keep moving." };
    }
    if (
      (!previousCurriculumContinuity.hasCurriculumOutcomes && hasCurriculumOutcomes) ||
      (!previousCurriculumContinuity.hasCurriculumTracking && hasCurriculumTracking)
    ) {
      return {
        label:
          !previousCurriculumContinuity.hasCurriculumOutcomes && hasCurriculumOutcomes
            ? "Stronger now"
            : "New progress",
        text:
          !previousCurriculumContinuity.hasCurriculumOutcomes && hasCurriculumOutcomes
            ? "stronger than before."
            : "new progress since your last visit.",
      };
    }
    return { label: "Not much changed yet", text: "not much has changed yet." };
  }, [
    hasCurriculumOutcomes,
    hasCurriculumTracking,
    highlightOutcomesSection,
    previousCurriculumContinuity,
  ]);
  const curriculumSetupConfidence = useMemo(() => {
    if (!highlightSetupSection) return null;
    if (!hasCurriculumSetup) {
      return { label: "Confidence", text: "Still light so far, with a clear next step." };
    }
    return hasCurriculumOutcomes
      ? { label: "Confidence", text: "Usable for the next step." }
      : { label: "Confidence", text: "Usable soon." };
  }, [hasCurriculumOutcomes, hasCurriculumSetup, highlightSetupSection]);
  const curriculumOutcomesConfidence = useMemo(() => {
    if (!highlightOutcomesSection) return null;
    if (!hasCurriculumOutcomes) {
      return hasCurriculumSetup
        ? { label: "Confidence", text: "One more strong piece will help." }
        : { label: "Confidence", text: "Still light so far, with a clear next step." };
    }
    return hasCurriculumTracking
      ? { label: "Confidence", text: "Ready for the next move." }
      : { label: "Confidence", text: "Usable soon." };
  }, [
    hasCurriculumOutcomes,
    hasCurriculumSetup,
    hasCurriculumTracking,
    highlightOutcomesSection,
  ]);
  const curriculumSetupNextMove = useMemo(() => {
    if (!highlightSetupSection) return null;
    if (!hasCurriculumSetup) {
      return { text: "Refine this here." };
    }
    return { text: "Go to Capture", href: "/capture" };
  }, [hasCurriculumSetup, highlightSetupSection]);
  const curriculumOutcomesNextMove = useMemo(() => {
    if (!highlightOutcomesSection) return null;
    if (!hasCurriculumOutcomes) {
      return { text: "Refine this here." };
    }
    return hasCurriculumTracking
      ? { text: "Go to Capture", href: "/capture" }
      : {
          text: "Go to Planner",
          href: activeLearner?.id
            ? `/planner?student=${encodeURIComponent(activeLearner.id)}`
            : "/planner",
        };
  }, [
    activeLearner?.id,
    hasCurriculumOutcomes,
    hasCurriculumTracking,
    highlightOutcomesSection,
  ]);

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Curriculum"
      heroTitle="See the learner's curriculum clearly"
      heroText="Track what belongs to this learner's framework, what has started, and what still needs gentle attention."
      heroAsideTitle="Curriculum mapper"
      heroAsideText="This is the first live curriculum map surface backed by the canonical family settings and learner mapper tables."
    >
      <div style={S.page}>
        {curriculumGuidanceNote ? (
          <section
            style={{
              ...S.card,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1e3a8a",
              fontWeight: 700,
            }}
          >
            <div style={{ ...S.cardText, color: "#1e3a8a" }}>{curriculumGuidanceNote}</div>
          </section>
        ) : null}
        <section
          style={{
            ...S.topCard,
            ...(highlightSetupSection
              ? {
                  border: "1px solid #93c5fd",
                  boxShadow: "0 0 0 3px rgba(59,130,246,0.10)",
                }
              : {}),
          }}
        >
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
          {curriculumSetupCue ? (
            <div style={S.guidedInlineNote}>{curriculumSetupCue}</div>
          ) : null}
          {curriculumSetupCompletion ? (
            <div style={{ marginTop: 14 }}>
              <GuidedCompletionFeedback
                momentumLabel={curriculumSetupMomentum?.label}
                momentumText={curriculumSetupMomentum?.text}
                continuityLabel={curriculumSetupContinuity?.label}
                continuityText={curriculumSetupContinuity?.text}
                confidenceLabel={curriculumSetupConfidence?.label}
                confidenceText={curriculumSetupConfidence?.text}
                nextValidMoveLabel="Next valid move"
                nextValidMoveText={curriculumSetupNextMove?.text}
                nextValidMoveHref={curriculumSetupNextMove?.href}
                inPlaceText={curriculumSetupCompletion.inPlaceText}
                stillNeededText={curriculumSetupCompletion.stillNeededText}
                nextStepText={curriculumSetupCompletion.nextStepText}
              />
            </div>
          ) : null}
        </section>

        {workspaceError ? <section style={S.warningCard}>{workspaceError}</section> : null}
        {statusMessage ? <section style={S.successCard}>{statusMessage}</section> : null}
        {error ? <section style={S.errorCard}>{error}</section> : null}

        {workspaceLoading || loading ? (
          <section style={S.card}>
            <div style={S.cardText}>Loading learner curriculum map...</div>
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
            text="The learner's framework is selected, but no canonical outcomes were found for this level yet."
          >
            {curriculumOutcomesCompletion ? (
              <GuidedCompletionFeedback
                momentumLabel={curriculumOutcomesMomentum?.label}
                momentumText={curriculumOutcomesMomentum?.text}
                continuityLabel={curriculumOutcomesContinuity?.label}
                continuityText={curriculumOutcomesContinuity?.text}
                confidenceLabel={curriculumOutcomesConfidence?.label}
                confidenceText={curriculumOutcomesConfidence?.text}
                nextValidMoveLabel="Next valid move"
                nextValidMoveText={curriculumOutcomesNextMove?.text}
                nextValidMoveHref={curriculumOutcomesNextMove?.href}
                inPlaceText={curriculumOutcomesCompletion.inPlaceText}
                stillNeededText={curriculumOutcomesCompletion.stillNeededText}
                nextStepText={curriculumOutcomesCompletion.nextStepText}
              />
            ) : null}
          </EmptyState>
        ) : (
          <>
            <section
              style={{
                ...S.summaryGrid,
                ...(highlightOutcomesSection
                  ? {
                      padding: 14,
                      border: "1px solid #93c5fd",
                      borderRadius: 18,
                      background: "#f8fbff",
                    }
                  : {}),
              }}
            >
              {curriculumOutcomesCue ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    ...S.guidedInlineNote,
                    marginBottom: 0,
                  }}
                >
                  {curriculumOutcomesCue}
                </div>
              ) : null}
              {curriculumOutcomesCompletion ? (
                <div style={{ gridColumn: "1 / -1" }}>
                  <GuidedCompletionFeedback
                    momentumLabel={curriculumOutcomesMomentum?.label}
                    momentumText={curriculumOutcomesMomentum?.text}
                    continuityLabel={curriculumOutcomesContinuity?.label}
                    continuityText={curriculumOutcomesContinuity?.text}
                    confidenceLabel={curriculumOutcomesConfidence?.label}
                    confidenceText={curriculumOutcomesConfidence?.text}
                    nextValidMoveLabel="Next valid move"
                    nextValidMoveText={curriculumOutcomesNextMove?.text}
                    nextValidMoveHref={curriculumOutcomesNextMove?.href}
                    inPlaceText={curriculumOutcomesCompletion.inPlaceText}
                    stillNeededText={curriculumOutcomesCompletion.stillNeededText}
                    nextStepText={curriculumOutcomesCompletion.nextStepText}
                  />
                </div>
              ) : null}
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
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Planned outcomes</div>
                <div style={S.summaryValue}>{pageData.plannedLinkedOutcomeCount}</div>
              </div>
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Evidence-linked outcomes</div>
                <div style={S.summaryValue}>{pageData.evidenceLinkedOutcomeCount}</div>
              </div>
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Planned and evidenced</div>
                <div style={S.summaryValue}>{pageData.plannedAndEvidencedOutcomeCount}</div>
              </div>
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Plan links</div>
                <div style={S.summaryValue}>{pageData.totalPlanLinks}</div>
              </div>
              <div style={S.summaryCard}>
                <div style={S.summaryLabel}>Evidence links</div>
                <div style={S.summaryValue}>{pageData.totalEvidenceLinks}</div>
              </div>
            </section>

            <section style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <div style={S.cardTitle}>Progress snapshot</div>
                  <div style={S.cardText}>
                    {pageData.trackedOutcomeCount > 0
                      ? pageData.totalPlanLinks > 0 && pageData.totalEvidenceLinks > 0
                        ? "These counts now show saved learner status, linked planning, and linked evidence together."
                        : pageData.totalPlanLinks > 0
                          ? "These counts come from saved learner outcome statuses, with curriculum-linked planning now visible across the map."
                          : pageData.totalEvidenceLinks > 0
                            ? "These counts come from saved learner outcome statuses, with linked evidence now visible across the map."
                            : "These counts come from saved learner outcome statuses. No curriculum-linked planning or evidence has been added yet."
                      : pageData.totalPlanLinks > 0 && pageData.totalEvidenceLinks > 0
                        ? "No saved learner outcome rows exist yet, but linked planning and evidence are now visible below so progress feels more intentional."
                        : pageData.totalPlanLinks > 0
                          ? "No saved learner outcome rows exist yet, but linked planning is visible below so intended learning is clear."
                          : pageData.totalEvidenceLinks > 0
                            ? "No saved learner outcome rows exist yet, but linked evidence is now visible below so progress is grounded in real captured work."
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

            {pageData.totalPlanLinks === 0 ? (
              <section style={S.card}>
                <div style={S.cardHeader}>
                  <div>
                    <div style={S.cardTitle}>No curriculum-linked planning yet</div>
                    <div style={S.cardText}>
                      The curriculum map is ready, but no saved planner items have been linked
                      to outcomes for this learner yet. Link weekly checklist items in Planner
                      to make intended learning visible here.
                    </div>
                  </div>
                </div>
                <Link href="/planner" style={S.primaryLink}>
                  Open planner
                </Link>
              </section>
            ) : null}

            {pageData.totalEvidenceLinks === 0 ? (
              <section style={S.card}>
                <div style={S.cardHeader}>
                  <div>
                    <div style={S.cardTitle}>No evidence is linked yet</div>
                    <div style={S.cardText}>
                      The curriculum map is ready, but no saved evidence has been linked to
                      outcomes for this learner yet. Capture a learning record and link it to
                      curriculum to make progress feel more grounded.
                    </div>
                  </div>
                </div>
                <Link href="/capture" style={S.primaryLink}>
                  Open capture
                </Link>
              </section>
            ) : null}

            {pageData.areas.map((area) => (
              <section key={area.id} style={S.card}>
                <div style={S.areaHeader}>
                  <div>
                    <div style={S.cardTitle}>{area.name}</div>
                    <div style={S.cardText}>
                      {area.strands.length} strand{area.strands.length === 1 ? "" : "s"}, {Object.values(area.counts).reduce((sum, count) => sum + count, 0)} outcomes, {area.plannedCount} plan link{area.plannedCount === 1 ? "" : "s"}, {area.evidenceCount} evidence link{area.evidenceCount === 1 ? "" : "s"}
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
                                <div style={S.outcomeMetaRow}>
                                  <span
                                    style={{
                                      ...S.countChip,
                                      background:
                                        outcome.plannedCount > 0 ? "#f8fafc" : "#ffffff",
                                      borderColor:
                                        outcome.plannedCount > 0 ? "#cbd5e1" : "#e5e7eb",
                                      color:
                                        outcome.plannedCount > 0 ? "#334155" : "#64748b",
                                    }}
                                  >
                                    {outcome.plannedCount > 0
                                      ? `Planned: ${outcome.plannedCount}`
                                      : "Not planned yet"}
                                  </span>
                                  <span
                                    style={{
                                      ...S.countChip,
                                      background:
                                        outcome.evidenceCount > 0 ? "#eff6ff" : "#f8fafc",
                                      borderColor:
                                        outcome.evidenceCount > 0 ? "#bfdbfe" : "#e5e7eb",
                                      color:
                                        outcome.evidenceCount > 0 ? "#1d4ed8" : "#64748b",
                                    }}
                                  >
                                    {outcome.evidenceCount > 0
                                      ? `Evidence linked: ${outcome.evidenceCount}`
                                      : "No evidence yet"}
                                  </span>
                                  {outcome.recentEvidenceTitles.length > 0 ? (
                                    <span style={S.outcomeMetaText}>
                                      {outcome.recentEvidenceTitles.join(" / ")}
                                    </span>
                                  ) : null}
                                  <span style={S.outcomeMetaText}>
                                    {outcome.plannedCount > 0 && outcome.evidenceCount > 0
                                      ? "Both planned and evidenced"
                                      : outcome.plannedCount > 0
                                        ? "Planned but not evidenced yet"
                                        : outcome.evidenceCount > 0
                                          ? "Evidenced without much prior planning"
                                          : "No linked planning or evidence yet"}
                                  </span>
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
  guidedInlineNote: {
    marginTop: 14,
    border: "1px solid #dbeafe",
    borderRadius: 14,
    background: "#eff6ff",
    color: "#1e3a8a",
    padding: "12px 14px",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 700,
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
  outcomeMetaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  outcomeMetaText: { fontSize: 12, lineHeight: 1.5, color: "#64748b" },
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

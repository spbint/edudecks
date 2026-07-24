"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import { listCleanAssessmentSkillStatuses } from "@/lib/clean/assessments/client";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import {
  buildPathwayCaptureContext,
  buildPathwayCaptureSearchParams,
  parsePathwayContextFromNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import {
  listCleanEvidenceEntries,
  subscribeToCleanEvidenceChanges,
  shouldRefreshCleanEvidenceForLearner,
} from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { Learner } from "@/lib/clean/learners/types";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { buildLearningIntelligenceSummary } from "@/lib/clean/curriculum/learningIntelligenceSummary";
import {
  buildCleanCoverageRecordPdfFilename,
  buildCurriculumCoveragePdfModel,
  CURRICULUM_COVERAGE_EMPTY_COPY,
  generateCurriculumCoveragePdfBytes,
} from "@/lib/clean/outputs/curriculumCoveragePdf";

const cardStyle: React.CSSProperties = {
  border: "1px solid #e7eaf2",
  borderRadius: 20,
  background: "#ffffff",
  boxShadow: "0 8px 24px rgba(23,32,75,0.05)",
  padding: "clamp(16px, 3vw, 24px)",
};

const primaryActionStyle: React.CSSProperties = {
  minHeight: 46,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 14,
  padding: "10px 16px",
  border: "1px solid #17204b",
  background: "#17204b",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
};

const secondaryActionStyle: React.CSSProperties = {
  ...primaryActionStyle,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#17204b",
};

const quietTextStyle: React.CSSProperties = {
  color: "#5b6478",
  lineHeight: 1.65,
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function learnerDisplayName(learner: Learner | null) {
  if (!learner) return "Learner";
  const givenName = safe(learner.preferredName) || safe(learner.firstName) || "Learner";
  const surname = safe(learner.surname);
  return surname && surname.toLowerCase() !== givenName.toLowerCase()
    ? `${givenName} ${surname}`
    : givenName;
}

function dateLabel(value: string | null | undefined) {
  const text = safe(value);
  if (!text) return "Date not recorded";
  const date = new Date(text.length === 10 ? `${text}T00:00:00` : text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function evidenceTitle(entry: CleanEvidenceEntry) {
  return safe(entry.title) || safe(entry.whatHappened).slice(0, 90) || "Saved learning record";
}

function isRecent(value: string | null | undefined) {
  const parsed = Date.parse(safe(value));
  return Number.isFinite(parsed) && Date.now() - parsed <= 30 * 86400000;
}

function learnerPath(path: string, learnerId: string) {
  if (!learnerId) return path;
  return `${path}?${new URLSearchParams({ learner_id: learnerId }).toString()}`;
}

type NextStep = ReturnType<typeof buildLearningIntelligenceSummary>["nextLearningSteps"][number];

function pathwayPath(learnerId: string, nextStep: NextStep | null) {
  const params = new URLSearchParams();
  if (learnerId) params.set("learnerId", learnerId);
  if (nextStep) {
    params.set("subject", nextStep.subjectKey);
    params.set("pathway", nextStep.strandKey);
    params.set("stage", nextStep.stageKey);
    params.set("pathwayStepId", nextStep.pathwayStepId);
  }
  const query = params.toString();
  return query ? `/my-pathways?${query}` : "/my-pathways";
}

function capturePath(learnerId: string, latestEntry: CleanEvidenceEntry | null) {
  const sourceContext = latestEntry
    ? parsePathwayContextFromNodeIds(latestEntry.curriculumNodeIds)
    : null;
  const validContext = sourceContext ? buildPathwayCaptureContext(sourceContext) : null;
  if (validContext) {
    return `/my-capture?${buildPathwayCaptureSearchParams(validContext, { learnerId }).toString()}`;
  }
  return learnerPath("/my-capture", learnerId);
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const url = window.URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function Disclosure({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentId = `${id}-content`;

  return (
    <section style={cardStyle}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        style={{
          width: "100%",
          minHeight: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: 0,
          border: 0,
          background: "transparent",
          color: "#17204b",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 17 }}>{title}</strong>
          <span style={{ ...quietTextStyle, fontSize: 13 }}>{description}</span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open ? <div id={contentId} style={{ display: "grid", gap: 14, marginTop: 18 }}>{children}</div> : null}
    </section>
  );
}

function EmptyWorkspace({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href?: string;
  label?: string;
}) {
  return (
    <section style={cardStyle}>
      <h2 style={{ margin: 0, color: "#17204b", fontSize: 20 }}>{title}</h2>
      <p style={{ ...quietTextStyle, margin: "10px 0 0" }}>{body}</p>
      {href && label ? <div style={{ marginTop: 16 }}><Link href={href} style={primaryActionStyle}>{label}</Link></div> : null}
    </section>
  );
}

export default function CleanMyLearnaWorkspace() {
  const workspace = useCleanFamilyWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [entries, setEntries] = useState<CleanEvidenceEntry[]>([]);
  const [assessmentStatuses, setAssessmentStatuses] = useState<CleanAssessmentSkillStatus[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesRefreshing, setEntriesRefreshing] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentRefreshing, setAssessmentRefreshing] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [coverageSubmitting, setCoverageSubmitting] = useState(false);
  const [coverageMessage, setCoverageMessage] = useState<string | null>(null);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const requestGenerationRef = useRef(0);
  const inFlightRefreshRef = useRef<{
    key: string;
    promise: Promise<void>;
  } | null>(null);
  const lastRefreshStartedAtRef = useRef(0);
  const loadedEvidenceKeyRef = useRef("");
  const loadedAssessmentKeyRef = useRef("");

  const queryLearnerId = searchParams.get("learner_id") || searchParams.get("learnerId") || "";
  const pathname = usePathname();
  const profileId = workspace.profile?.id ?? "";
  const selectedLearner = workspace.learners.find((learner) => learner.id === selectedLearnerId) ?? null;
  const selectedLearnerName = learnerDisplayName(selectedLearner);

  useEffect(() => {
    if (!workspace.learners.length) {
      setSelectedLearnerId("");
      return;
    }
    if (selectedLearnerId && workspace.learners.some((learner) => learner.id === selectedLearnerId)) return;
    const queryLearner = workspace.learners.find((learner) => learner.id === queryLearnerId);
    const defaultLearner = workspace.learners.find((learner) => learner.id === workspace.profile?.defaultLearnerId);
    setSelectedLearnerId(queryLearner?.id || defaultLearner?.id || workspace.learners[0]?.id || "");
  }, [queryLearnerId, selectedLearnerId, workspace.learners, workspace.profile?.defaultLearnerId]);

  const evidenceKey = profileId && selectedLearnerId
    ? `${profileId}:${selectedLearnerId}`
    : "";
  const visibleEntries = useMemo(
    () => (loadedEvidenceKeyRef.current === evidenceKey ? entries : []),
    [entries, evidenceKey],
  );
  const visibleAssessmentStatuses = useMemo(
    () => (loadedAssessmentKeyRef.current === evidenceKey ? assessmentStatuses : []),
    [assessmentStatuses, evidenceKey],
  );

  const reloadLearnerData = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    if (!evidenceKey || !profileId || workspace.schemaMissing || workspace.requiresFamilyCreation) return;

    const existingRefresh = inFlightRefreshRef.current;
    if (existingRefresh?.key === evidenceKey) return existingRefresh.promise;

    const now = Date.now();
    if (!force && now - lastRefreshStartedAtRef.current < 1200) return;
    lastRefreshStartedAtRef.current = now;

    const generation = ++requestGenerationRef.current;
    const hasLoadedEvidence = loadedEvidenceKeyRef.current === evidenceKey;
    const hasLoadedAssessment = loadedAssessmentKeyRef.current === evidenceKey;

    setEntriesError(null);
    setAssessmentError(null);
    setEntriesLoading(!hasLoadedEvidence);
    setEntriesRefreshing(hasLoadedEvidence);
    setAssessmentLoading(!hasLoadedAssessment);
    setAssessmentRefreshing(hasLoadedAssessment);
    if (!hasLoadedEvidence) setEntries([]);
    if (!hasLoadedAssessment) setAssessmentStatuses([]);

    const refreshPromise = Promise.all([
      listCleanEvidenceEntries(profileId, { learnerId: selectedLearnerId, limit: 250 })
        .then((nextEntries) => {
          if (generation !== requestGenerationRef.current) return;
          loadedEvidenceKeyRef.current = evidenceKey;
          setEntries(nextEntries);
        })
        .catch((error) => {
          if (generation !== requestGenerationRef.current) return;
          setEntriesError(normalizeCleanErrorMessage(error, "We could not load recent learning right now."));
        })
        .finally(() => {
          if (generation !== requestGenerationRef.current) return;
          setEntriesLoading(false);
          setEntriesRefreshing(false);
        }),
      listCleanAssessmentSkillStatuses(profileId, selectedLearnerId)
        .then((nextStatuses) => {
          if (generation !== requestGenerationRef.current) return;
          loadedAssessmentKeyRef.current = evidenceKey;
          setAssessmentStatuses(nextStatuses);
        })
        .catch((error) => {
          if (generation !== requestGenerationRef.current) return;
          setAssessmentError(normalizeCleanErrorMessage(error, "We could not load progress judgements right now."));
        })
        .finally(() => {
          if (generation !== requestGenerationRef.current) return;
          setAssessmentLoading(false);
          setAssessmentRefreshing(false);
        }),
    ]).then(() => undefined).finally(() => {
      if (inFlightRefreshRef.current?.key === evidenceKey) {
        inFlightRefreshRef.current = null;
      }
    });

    inFlightRefreshRef.current = { key: evidenceKey, promise: refreshPromise };
    return refreshPromise;
  }, [evidenceKey, profileId, selectedLearnerId, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  useEffect(() => {
    if (!evidenceKey) {
      ++requestGenerationRef.current;
      inFlightRefreshRef.current = null;
      loadedEvidenceKeyRef.current = "";
      loadedAssessmentKeyRef.current = "";
      setEntries([]);
      setAssessmentStatuses([]);
      setEntriesLoading(false);
      setEntriesRefreshing(false);
      setAssessmentLoading(false);
      setAssessmentRefreshing(false);
      return;
    }

    const refreshIfVisible = (force = false) => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void reloadLearnerData({ force });
    };
    const handleEvidenceChanged = (detail: { familyId: string; learnerId?: string | null }) => {
      if (!shouldRefreshCleanEvidenceForLearner(detail, profileId, selectedLearnerId)) return;
      refreshIfVisible(true);
    };
    const handlePageShow = () => refreshIfVisible(true);
    const handleVisibilityChange = () => refreshIfVisible(false);
    const handleFocus = () => refreshIfVisible(false);
    const unsubscribe = subscribeToCleanEvidenceChanges(handleEvidenceChanged);

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void reloadLearnerData({ force: true });

    return () => {
      unsubscribe();
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [evidenceKey, pathname, profileId, reloadLearnerData, selectedLearnerId]);

  const summary = useMemo(
    () => buildLearningIntelligenceSummary({
      evidenceEntries: visibleEntries,
      assessmentStatuses: visibleAssessmentStatuses,
      learnerYearLevel: selectedLearner?.yearLevel ?? null,
    }),
    [selectedLearner?.yearLevel, visibleAssessmentStatuses, visibleEntries],
  );
  const latestEntry = visibleEntries[0] ?? null;
  const latestPathwayContext = latestEntry ? parsePathwayContextFromNodeIds(latestEntry.curriculumNodeIds) : null;
  const latestJudgement = summary.progressJudgementObservations[0] ?? null;
  const hasPathwaySignal = Boolean(
    summary.nextLearningSteps[0] &&
      (summary.activeLearningAreaRows.length > 0 || visibleAssessmentStatuses.some((status) => Boolean(status.pathwayStepId))),
  );
  const nextStep = hasPathwaySignal ? summary.nextLearningSteps[0] ?? null : null;
  const primaryAction = nextStep
    ? { label: "Continue learning", href: pathwayPath(selectedLearnerId, nextStep) }
      : visibleEntries.length
      ? { label: "Add evidence", href: capturePath(selectedLearnerId, latestEntry) }
      : { label: "Choose a learning pathway", href: pathwayPath(selectedLearnerId, null) };
  const quickCaptureHref = capturePath(selectedLearnerId, latestEntry);
  const activeAreas = summary.allSubjectRows.filter((row) => row.isActiveLearningArea);
  const quietAreas = summary.allSubjectRows.filter((row) => !row.isActiveLearningArea);
  const reportReadyCount = visibleEntries.filter((entry) => entry.includeInReport).length;
  const hasRecentLearning = isRecent(latestEntry?.observedOn || latestEntry?.createdAt);
  const recordHealth = visibleEntries.length === 0
    ? { label: "Empty", copy: "Add a first observation, work sample or photo to begin the learning story." }
    : hasRecentLearning && reportReadyCount > 0
      ? { label: "Healthy", copy: "You have recent learning records and report-ready evidence." }
      : hasRecentLearning
        ? { label: "Building", copy: "Your learning record is taking shape." }
        : { label: "Attention", copy: "A recent note or photo would make this learning picture clearer." };

  const handleLearnerChange = (learnerId: string) => {
    setSelectedLearnerId(learnerId);
    const params = new URLSearchParams(searchParams.toString());
    if (learnerId) params.set("learner_id", learnerId);
    else params.delete("learner_id");
    router.replace(`/my-learna${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleDownloadCoverageRecord = useCallback(async () => {
    if (!workspace.profile || !selectedLearner) return;
    setCoverageSubmitting(true);
    setCoverageMessage(null);
    setCoverageError(null);
    try {
      const model = buildCurriculumCoveragePdfModel({
        profile: workspace.profile,
        learner: selectedLearner,
        entries: visibleEntries,
        assessmentStatuses: visibleAssessmentStatuses,
        generatedOn: new Date().toISOString().slice(0, 10),
      });
      downloadPdf(
        await generateCurriculumCoveragePdfBytes(model),
        buildCleanCoverageRecordPdfFilename(model.learnerName, new Date().getFullYear()),
      );
      setCoverageMessage(model.coverageSummary.hasLinkedEvidence ? "Coverage record downloaded." : CURRICULUM_COVERAGE_EMPTY_COPY);
    } catch (error) {
      setCoverageError(normalizeCleanErrorMessage(error, "Could not create the coverage record. Please try again."));
    } finally {
      setCoverageSubmitting(false);
    }
  }, [selectedLearner, visibleAssessmentStatuses, visibleEntries, workspace.profile]);

  if (workspace.loading) return <V2LoadingState title="Preparing My Learna" body="Your learner guidance is loading." />;
  if (workspace.schemaMissing) return <EmptyWorkspace title="My Learna needs a little setup" body={CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE} />;
  if (!workspace.profile || workspace.requiresFamilyCreation) {
    return <EmptyWorkspace title="Set up your family workspace" body="My Learna turns saved learning into a useful family view once your family workspace is ready." href="/my-profile" label="Open My Profile" />;
  }
  if (!workspace.learners.length) {
    return <EmptyWorkspace title="Add a learner to begin" body="Add a learner before My Learna can show a personal learning story." href="/my-profile" label="Add a learner" />;
  }

  return (
    <main aria-labelledby="my-learna-heading" data-my-learna-workspace="true" style={{ display: "grid", gap: 16, maxWidth: 1120, margin: "0 auto", minWidth: 0 }}>
      <style jsx global>{`
        [data-my-learna-workspace] { overflow-wrap: anywhere; }
        [data-my-learna-workspace] a:focus-visible,
        [data-my-learna-workspace] button:focus-visible,
        [data-my-learna-workspace] select:focus-visible { outline: 3px solid #8b5cf6; outline-offset: 3px; }
        @media (min-width: 820px) { .mylearna-guidance-top { grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr) !important; } }
      `}</style>
      {workspace.error ? <div role="status" style={{ ...cardStyle, borderColor: "#fcd34d", background: "#fffbeb", color: "#92400e", padding: 14 }}>{workspace.error} The latest saved view is shown while the workspace refreshes.</div> : null}
      <section className="mylearna-guidance-top" style={{ ...cardStyle, display: "grid", gap: 18, gridTemplateColumns: "1fr", padding: "clamp(18px, 4vw, 30px)" }}>
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <label style={{ display: "grid", gap: 6, maxWidth: 360 }}>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Learner</span>
            <select aria-label="Choose learner" value={selectedLearnerId} onChange={(event) => handleLearnerChange(event.target.value)} style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 12, padding: "0 12px", background: "#ffffff", color: "#17204b", fontWeight: 700 }}>
              {workspace.learners.map((learner) => <option key={learner.id} value={learner.id}>{learnerDisplayName(learner)}</option>)}
            </select>
          </label>
          <div>
            <p style={{ margin: 0, color: "#6c4df6", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>My Learna</p>
            <h1 id="my-learna-heading" style={{ margin: "6px 0 0", color: "#17204b", fontSize: "clamp(28px, 6vw, 46px)", lineHeight: 1.05 }}>{selectedLearnerName}&apos;s Learning</h1>
            <p style={{ ...quietTextStyle, margin: "12px 0 0", fontSize: 16 }}>See what {selectedLearnerName} has been learning, what the evidence is beginning to show, and what could come next.</p>
          </div>
        </div>
        <aside style={{ borderRadius: 18, padding: 18, background: "#f5f3ff", border: "1px solid #ddd6fe", display: "grid", gap: 10, alignContent: "start" }}>
          <strong style={{ color: "#17204b", fontSize: 16 }}>A calm learning picture</strong>
          <p style={{ ...quietTextStyle, margin: 0 }}>You&apos;re building a useful picture of {selectedLearnerName}&apos;s recent learning.</p>
          <span style={{ color: "#6c4df6", fontSize: 13, fontWeight: 800 }}>{entriesLoading ? "Refreshing recent records" : "Based on saved records"}</span>
        </aside>
      </section>
      <section style={{ ...cardStyle, display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Current focus</p>
          <h2 style={{ margin: 0, color: "#17204b", fontSize: 22 }}>{nextStep ? `${nextStep.subjectTitle} · ${nextStep.strandTitle}` : summary.activeLearningAreaRows[0]?.title || "A new learning story"}</h2>
          <p style={{ ...quietTextStyle, margin: 0 }}>{nextStep?.stepTitle || latestPathwayContext?.stepTitle || (visibleEntries.length ? "Recent learning is ready to review." : "Choose a pathway to discover a current focus.")}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={primaryAction.href} style={primaryActionStyle}>{primaryAction.label}</Link>
          <Link href={quickCaptureHref} style={secondaryActionStyle}>Add a quick note or photo</Link>
        </div>
      </section>
      <section style={{ ...cardStyle, display: "grid", gap: 8, borderColor: recordHealth.label === "Attention" ? "#fcd34d" : "#e7eaf2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}><strong style={{ color: "#17204b", fontSize: 17 }}>Records</strong><span style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>{recordHealth.label}</span></div>
        <p style={{ ...quietTextStyle, margin: 0 }}>{recordHealth.copy}</p>
        {entriesError ? <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{entriesError}</div> : null}
        {assessmentError ? <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{assessmentError}</div> : null}
        {entriesError || assessmentError ? <button type="button" onClick={() => void reloadLearnerData({ force: true })} style={{ ...secondaryActionStyle, width: "fit-content", minHeight: 44 }}>Try again</button> : null}
      </section>
      <section style={{ ...cardStyle, display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, color: "#17204b", fontSize: 21 }}>What the evidence suggests</h2>
        {latestJudgement ? <><p style={{ ...quietTextStyle, margin: 0 }}>Your latest saved judgement is <strong style={{ color: "#17204b" }}>{latestJudgement.judgement}</strong>.</p><p style={{ ...quietTextStyle, margin: 0, fontSize: 13 }}>{dateLabel(latestJudgement.dateValue)}{latestJudgement.subjectTitle ? ` · ${latestJudgement.subjectTitle}` : ""}{latestJudgement.stepTitle ? ` · ${latestJudgement.stepTitle}` : ""}</p><Link href={latestJudgement.sourceType === "evidence" ? `${learnerPath("/my-portfolio", selectedLearnerId)}&latestEvidenceId=${encodeURIComponent(latestJudgement.sourceId)}` : pathwayPath(selectedLearnerId, nextStep)} style={{ ...secondaryActionStyle, width: "fit-content", minHeight: 44 }}>View the underlying record</Link></> : <p style={{ ...quietTextStyle, margin: 0 }}>There is not enough saved evidence yet to describe change over time.</p>}
      </section>
      <Disclosure id="progress-and-judgements" title="Progress and judgements" description="Saved judgements and pathway state, not activity volume.">
        {assessmentLoading ? <p role="status" style={{ ...quietTextStyle, margin: 0 }}>Loading saved judgements...</p> : null}
        {assessmentRefreshing ? <p role="status" style={{ ...quietTextStyle, margin: 0 }}>Refreshing saved judgements...</p> : null}
        {summary.progressJudgementObservations.length ? summary.progressJudgementObservations.slice(0, 6).map((observation) => <article key={observation.id} style={{ borderTop: "1px solid #e7eaf2", paddingTop: 12, display: "grid", gap: 5 }}><strong style={{ color: "#17204b" }}>{observation.judgement}</strong><span style={{ ...quietTextStyle, fontSize: 13 }}>{dateLabel(observation.dateValue)}{observation.subjectTitle ? ` · ${observation.subjectTitle}` : ""}{observation.stepTitle ? ` · ${observation.stepTitle}` : ""}</span></article>) : <p style={{ ...quietTextStyle, margin: 0 }}>No recognised progress judgement has been saved yet.</p>}
        {nextStep ? <Link href={pathwayPath(selectedLearnerId, nextStep)} style={{ ...secondaryActionStyle, width: "fit-content", minHeight: 44 }}>Open pathway</Link> : null}
      </Disclosure>
      <Disclosure id="recent-records" title="Recent records" description="Saved observations and work samples, with Portfolio as the full record.">
        {entriesLoading ? <p role="status" style={{ ...quietTextStyle, margin: 0 }}>Loading recent records...</p> : null}
        {entriesRefreshing ? <p role="status" style={{ ...quietTextStyle, margin: 0 }}>Refreshing recent records...</p> : null}
        {visibleEntries.length ? visibleEntries.slice(0, 4).map((entry) => <Link key={entry.id} href={`${learnerPath("/my-portfolio", selectedLearnerId)}&latestEvidenceId=${encodeURIComponent(entry.id)}`} style={{ display: "grid", gap: 4, padding: "12px 0", borderTop: "1px solid #e7eaf2", color: "#17204b", textDecoration: "none" }}><strong>{evidenceTitle(entry)}</strong><span style={{ ...quietTextStyle, fontSize: 13 }}>{dateLabel(entry.observedOn)}{entry.learningArea ? ` · ${entry.learningArea}` : ""}</span></Link>) : <p style={{ ...quietTextStyle, margin: 0 }}>No saved learning records yet.</p>}
        <Link href={learnerPath("/my-portfolio", selectedLearnerId)} style={{ ...secondaryActionStyle, width: "fit-content", minHeight: 44 }}>View Portfolio</Link>
      </Disclosure>
      <Disclosure id="learning-areas" title="Learning areas" description="What has recently been active, without treating quiet areas as failure.">
        <div style={{ display: "grid", gap: 10 }}><strong style={{ color: "#17204b" }}>Active recently</strong>{activeAreas.length ? activeAreas.map((area) => <div key={area.key} style={{ padding: 12, borderRadius: 12, background: "#f8fbff", color: "#334155" }}>{area.title}<span style={{ display: "block", color: "#64748b", fontSize: 13 }}>{area.latestActivityLabel}</span></div>) : <p style={{ ...quietTextStyle, margin: 0 }}>No learning area has recent saved activity yet.</p>}</div>
        <div style={{ display: "grid", gap: 10 }}><strong style={{ color: "#17204b" }}>Quiet for now</strong><p style={{ ...quietTextStyle, margin: 0 }}>Quiet areas are not treated as missing. They simply have no recent plan or evidence.</p>{quietAreas.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{quietAreas.slice(0, 8).map((area) => <span key={area.key} style={{ padding: "8px 10px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 13 }}>{area.title}</span>)}</div> : null}</div>
      </Disclosure>
      <Disclosure id="reports-and-records" title="Reports and records" description="Useful report ingredients accumulating over time.">
        <div style={{ display: "grid", gap: 10, color: "#334155" }}><p style={{ margin: 0 }}>{reportReadyCount} {reportReadyCount === 1 ? "record is" : "records are"} selected for reports.</p><p style={{ margin: 0 }}>{summary.reportingReadiness.representedAreaCount} learning areas represented · {summary.progressJudgementObservations.length} progress judgements available.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link href={learnerPath("/my-reports", selectedLearnerId)} style={{ ...secondaryActionStyle, minHeight: 44 }}>Open My Reports</Link><button type="button" onClick={() => void handleDownloadCoverageRecord()} disabled={coverageSubmitting} style={{ ...secondaryActionStyle, minHeight: 44, cursor: coverageSubmitting ? "wait" : "pointer" }}>{coverageSubmitting ? "Preparing record..." : "Download coverage record"}</button></div>{coverageMessage ? <div role="status" style={{ color: "#166534", fontSize: 13 }}>{coverageMessage}</div> : null}{coverageError ? <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{coverageError}</div> : null}</div>
      </Disclosure>
    </main>
  );
}

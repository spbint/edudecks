"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanLearningIntelligenceDashboard from "@/app/components/clean/CleanLearningIntelligenceDashboard";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import {
  listCleanAssessmentSkillStatuses,
} from "@/lib/clean/assessments/client";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildCurriculumCaptureContext,
  buildCurriculumCaptureSearchParams,
  type CleanCurriculumCaptureContext,
} from "@/lib/clean/evidence/curriculumContext";
import { buildRecognizedProgressJudgementObservations } from "@/lib/clean/pathways/pathwayStepState";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import { resolveCurriculumFrameworkMap } from "@/lib/clean/curriculum/frameworkMaps";
import {
  buildCurriculumCoverageSummary,
  type CurriculumCoverageAreaSummary,
  type CurriculumCoverageStatus,
} from "@/lib/clean/curriculum/coverageSummary";
import {
  buildCleanCoverageRecordPdfFilename,
  buildCurriculumCoveragePdfModel,
  CURRICULUM_COVERAGE_EMPTY_COPY,
  generateCurriculumCoveragePdfBytes,
} from "@/lib/clean/outputs/curriculumCoveragePdf";

const shellStyle: React.CSSProperties = {
  minHeight: "auto",
  background: "transparent",
  padding: 0,
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1320,
  margin: "0 auto",
  display: "grid",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 18,
  background: "#ffffff",
  padding: "clamp(14px, 2.4vw, 20px)",
  boxShadow: "0 6px 18px rgba(23,32,75,0.05)",
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 14,
  background: "#f8fbff",
  padding: 14,
  display: "grid",
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#64748b",
  textTransform: "uppercase",
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 8,
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function formatEvidenceTitle(entry: CleanEvidenceEntry) {
  return safe(entry.title) || safe(entry.whatHappened).slice(0, 72) || "Untitled evidence";
}

function formatEvidenceDateLabel(value: string) {
  const normalizedValue = safe(value);
  if (!normalizedValue) return "Date not recorded";

  const date = new Date(`${normalizedValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return normalizedValue;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEvidenceEventDateLabel(value: string | null) {
  const normalizedValue = safe(value);
  if (!normalizedValue) return "Date not recorded";

  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) {
    return formatEvidenceDateLabel(normalizedValue.slice(0, 10));
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEvidenceSnippet(entry: CleanEvidenceEntry) {
  const snippet = safe(entry.whatHappened) || safe(entry.reflection);
  if (!snippet) return "No short note recorded yet.";
  if (snippet.length <= 110) return snippet;
  return `${snippet.slice(0, 107)}...`;
}

function getEvidenceItemLabel(count: number) {
  return `${count} learning ${count === 1 ? "record" : "records"}`;
}

function getLatestEvidenceSummary(entry: CleanEvidenceEntry | null | undefined) {
  if (!entry) return "—";
  return `${formatEvidenceTitle(entry)} - ${formatEvidenceDateLabel(entry.observedOn)}`;
}

function getConsumerCoverageStatus(summary: CurriculumCoverageAreaSummary) {
  if (summary.count > 1 || summary.assessmentSummary.assessedCount > 0) {
    return "Active";
  }

  if (summary.count === 1) {
    return "Evidence recorded";
  }

  return "Not currently active";
}

function getAreaSortRank(summary: CurriculumCoverageAreaSummary) {
  const status = getConsumerCoverageStatus(summary);
  if (status === "Active") return 0;
  if (status === "Evidence recorded") return 1;
  return 2;
}

function sortCoverageAreas(summaries: CurriculumCoverageAreaSummary[]) {
  return [...summaries].sort((left, right) => {
    const rankDiff = getAreaSortRank(left) - getAreaSortRank(right);
    if (rankDiff !== 0) return rankDiff;
    if (right.count !== left.count) return right.count - left.count;
    return left.area.label.localeCompare(right.area.label);
  });
}

function getPreferredCoverageAreaId(summaries: CurriculumCoverageAreaSummary[]) {
  return sortCoverageAreas(summaries).find((summary) => getAreaSortRank(summary) < 2)?.area.key ?? "";
}

function coverageBadgeStyle(status: CurriculumCoverageStatus): React.CSSProperties {
  if (status === "Evidence building") {
    return {
      border: "1px solid #bfdbfe",
      background: "#eff6ff",
      color: "#1d4ed8",
    };
  }

  if (status === "Evidence started") {
    return {
      border: "1px solid #c7d2fe",
      background: "#eef2ff",
      color: "#4338ca",
    };
  }

  return {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#64748b",
  };
}

function getLearningAreaTone(areaKey: string, areaLabel: string) {
  const normalized = `${safe(areaKey)} ${safe(areaLabel)}`.toLowerCase();

  if (normalized.includes("math")) {
    return {
      accent: "#2563eb",
      border: "#93c5fd",
      mutedBorder: "#dbeafe",
      softBackground: "#f8fbff",
      selectedBackground: "#eff6ff",
      badgeBackground: "#dbeafe",
      badgeText: "#1d4ed8",
      shadow: "0 10px 24px rgba(37,99,235,0.10)",
    };
  }

  if (normalized.includes("english") || normalized.includes("literacy")) {
    return {
      accent: "#be185d",
      border: "#f9a8d4",
      mutedBorder: "#fbcfe8",
      softBackground: "#fff8fb",
      selectedBackground: "#fdf2f8",
      badgeBackground: "#fce7f3",
      badgeText: "#be185d",
      shadow: "0 10px 24px rgba(190,24,93,0.08)",
    };
  }

  if (normalized.includes("science")) {
    return {
      accent: "#0f766e",
      border: "#99f6e4",
      mutedBorder: "#ccfbf1",
      softBackground: "#f4fffd",
      selectedBackground: "#ecfeff",
      badgeBackground: "#ccfbf1",
      badgeText: "#0f766e",
      shadow: "0 10px 24px rgba(15,118,110,0.08)",
    };
  }

  if (normalized.includes("humanities") || normalized.includes("history") || normalized.includes("geography")) {
    return {
      accent: "#b45309",
      border: "#fcd34d",
      mutedBorder: "#fde68a",
      softBackground: "#fffdf6",
      selectedBackground: "#fffbeb",
      badgeBackground: "#fef3c7",
      badgeText: "#b45309",
      shadow: "0 10px 24px rgba(180,83,9,0.08)",
    };
  }

  if (normalized.includes("art") || normalized.includes("music") || normalized.includes("drama")) {
    return {
      accent: "#7c3aed",
      border: "#c4b5fd",
      mutedBorder: "#ddd6fe",
      softBackground: "#faf8ff",
      selectedBackground: "#f5f3ff",
      badgeBackground: "#ede9fe",
      badgeText: "#6d28d9",
      shadow: "0 10px 24px rgba(124,58,237,0.08)",
    };
  }

  if (normalized.includes("language")) {
    return {
      accent: "#15803d",
      border: "#86efac",
      mutedBorder: "#bbf7d0",
      softBackground: "#f7fff9",
      selectedBackground: "#f0fdf4",
      badgeBackground: "#dcfce7",
      badgeText: "#15803d",
      shadow: "0 10px 24px rgba(21,128,61,0.08)",
    };
  }

  if (normalized.includes("health") || normalized.includes("physical")) {
    return {
      accent: "#dc2626",
      border: "#fca5a5",
      mutedBorder: "#fecaca",
      softBackground: "#fff8f8",
      selectedBackground: "#fef2f2",
      badgeBackground: "#fee2e2",
      badgeText: "#b91c1c",
      shadow: "0 10px 24px rgba(220,38,38,0.08)",
    };
  }

  if (normalized.includes("technolog")) {
    return {
      accent: "#334155",
      border: "#cbd5e1",
      mutedBorder: "#e2e8f0",
      softBackground: "#f8fafc",
      selectedBackground: "#f1f5f9",
      badgeBackground: "#e2e8f0",
      badgeText: "#334155",
      shadow: "0 10px 24px rgba(51,65,85,0.08)",
    };
  }

  return {
    accent: "#475569",
    border: "#cbd5e1",
    mutedBorder: "#e2e8f0",
    softBackground: "#fafcff",
    selectedBackground: "#f8fafc",
    badgeBackground: "#e2e8f0",
    badgeText: "#475569",
    shadow: "0 10px 24px rgba(71,85,105,0.06)",
  };
}

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function CurriculumWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [entries, setEntries] = useState<CleanEvidenceEntry[]>([]);
  const [assessmentStatuses, setAssessmentStatuses] = useState<CleanAssessmentSkillStatus[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [assessmentStatusesError, setAssessmentStatusesError] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedAreaWasChosen, setSelectedAreaWasChosen] = useState(false);
  const [showAuthorityAreas, setShowAuthorityAreas] = useState(false);
  const [showDetailedCoverageMap, setShowDetailedCoverageMap] = useState(false);
  const [coverageSubmitting, setCoverageSubmitting] = useState(false);
  const [coverageMessage, setCoverageMessage] = useState<string | null>(null);
  const [coverageError, setCoverageError] = useState<string | null>(null);

  const capturePathBase = pathname.startsWith("/clean-my-curriculum")
    ? "/clean-my-capture"
    : "/my-capture";
  const resolvedFramework = useMemo(
    () => resolveCurriculumFrameworkMap(workspace.profile),
    [workspace.profile],
  );
  const brentModeActive = resolvedFramework.authorityOverlayActive;
  const supplementaryEvidenceAreas = resolvedFramework.supplementaryEvidenceAreas;

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  useEffect(() => {
    if (!workspace.learners.length) {
      setSelectedLearnerId("");
      return;
    }

    const currentIsValid = workspace.learners.some((learner) => learner.id === selectedLearnerId);
    if (currentIsValid) return;

    const defaultLearnerId = workspace.profile?.defaultLearnerId;
    const defaultIsValid = defaultLearnerId
      ? workspace.learners.some((learner) => learner.id === defaultLearnerId)
      : false;

    setSelectedLearnerId(defaultIsValid ? defaultLearnerId || "" : workspace.learners[0]?.id || "");
  }, [selectedLearnerId, workspace.learners, workspace.profile?.defaultLearnerId]);

  const reloadEntries = useCallback(async () => {
    if (!workspace.profile || !selectedLearnerId) {
      setEntries([]);
      return;
    }

    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const nextEntries = await listCleanEvidenceEntries(workspace.profile.id, {
        learnerId: selectedLearnerId,
        limit: 250,
      });
      setEntries(nextEntries);
    } catch (error) {
      setEntries([]);
      setEntriesError(
        normalizeCleanErrorMessage(
          error,
          "We could not load curriculum evidence just now.",
        ),
      );
    } finally {
      setEntriesLoading(false);
    }
  }, [selectedLearnerId, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setEntries([]);
      return;
    }

    if (!selectedLearnerId) return;
    void reloadEntries();
  }, [
    reloadEntries,
    selectedLearnerId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    let isCurrent = true;

    async function loadAssessmentStatuses() {
      if (!workspace.profile || !selectedLearnerId) {
        if (!isCurrent) return;
        setAssessmentStatuses([]);
        setAssessmentStatusesError(null);
        return;
      }

      try {
        const nextStatuses = await listCleanAssessmentSkillStatuses(
          workspace.profile.id,
          selectedLearnerId,
        );

        if (!isCurrent) return;
        setAssessmentStatuses(nextStatuses);
        setAssessmentStatusesError(null);
      } catch (error) {
        if (!isCurrent) return;
        setAssessmentStatuses([]);
        setAssessmentStatusesError(
          normalizeCleanErrorMessage(
            error,
            "We could not load learning confidence just now.",
          ),
        );
      }
    }

    if (workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setAssessmentStatuses([]);
      setAssessmentStatusesError(null);
      return undefined;
    }

    if (!selectedLearnerId) {
      setAssessmentStatuses([]);
      setAssessmentStatusesError(null);
      return undefined;
    }

    void loadAssessmentStatuses();

    return () => {
      isCurrent = false;
    };
  }, [
    selectedLearnerId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  const selectedLearner = useMemo(
    () =>
      workspace.learners.find((learner) => learner.id === selectedLearnerId) ?? null,
    [selectedLearnerId, workspace.learners],
  );
  const coverageSummary = useMemo(
    () =>
      buildCurriculumCoverageSummary({
        resolvedFramework,
        entries,
        assessmentStatuses,
      }),
    [assessmentStatuses, entries, resolvedFramework],
  );
  const areaSummaries = coverageSummary.areaSummaries;
  const sortedAreaSummaries = useMemo(() => sortCoverageAreas(areaSummaries), [areaSummaries]);
  const progressJudgementObservations = useMemo(
    () =>
      buildRecognizedProgressJudgementObservations({
        assessmentStatuses,
        evidenceEntries: entries,
        learnerId: selectedLearnerId,
      }),
    [assessmentStatuses, entries, selectedLearnerId],
  );

  useEffect(() => {
    setSelectedAreaId("");
    setSelectedAreaWasChosen(false);
  }, [selectedLearnerId]);

  useEffect(() => {
    if (!areaSummaries.length) {
      setSelectedAreaId("");
      return;
    }

    const hasCurrentSelection = areaSummaries.some((item) => item.area.key === selectedAreaId);
    if (hasCurrentSelection && selectedAreaWasChosen) return;

    setSelectedAreaId(getPreferredCoverageAreaId(areaSummaries));
  }, [areaSummaries, selectedAreaId, selectedAreaWasChosen]);

  const authorityAreaSummaries = coverageSummary.supplementaryAreaSummaries;
  const authorityAreasWithEvidenceCount =
    coverageSummary.supplementaryAreasWithEvidenceCount;
  const reportingEvidenceAreasActive = Boolean(
    resolvedFramework.map.reportingEvidenceAreas?.length,
  );
  const supplementaryAreasExpanded = showAuthorityAreas;
  const selectedLearnerDisplayName = selectedLearner
    ? getLearnerLabel(selectedLearner.firstName, selectedLearner.preferredName)
    : "Learner";

  useEffect(() => {
    setCoverageError(null);
    setCoverageMessage(null);
  }, [selectedLearnerId]);

  function buildCaptureHref(context: Partial<CleanCurriculumCaptureContext>) {
    const nextContext = buildCurriculumCaptureContext(context);
    if (!nextContext) {
      return capturePathBase;
    }

    const params = buildCurriculumCaptureSearchParams(nextContext, {
      learnerId: selectedLearnerId || null,
    });

    return `${capturePathBase}?${params.toString()}`;
  }

  async function handleDownloadCoverageRecord() {
    if (!workspace.profile || !selectedLearner) {
      setCoverageError("Add a learner before creating this coverage record.");
      setCoverageMessage(null);
      return;
    }

    setCoverageSubmitting(true);
    setCoverageError(null);
    setCoverageMessage(null);

    try {
      const model = buildCurriculumCoveragePdfModel({
        profile: workspace.profile,
        learner: selectedLearner,
        entries,
        assessmentStatuses,
        generatedOn: new Date().toISOString().slice(0, 10),
      });
      const pdfBytes = await generateCurriculumCoveragePdfBytes(model);

      downloadPdf(
        pdfBytes,
        buildCleanCoverageRecordPdfFilename(model.learnerName, new Date().getFullYear()),
      );
      setCoverageMessage(
        model.coverageSummary.hasLinkedEvidence
          ? "Curriculum coverage record downloaded."
          : CURRICULUM_COVERAGE_EMPTY_COPY,
      );
    } catch (error) {
      setCoverageError(
        normalizeCleanErrorMessage(
          error,
          "Could not create the curriculum coverage record. Please try again.",
        ),
      );
    } finally {
      setCoverageSubmitting(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <style jsx global>{`
          @media (max-width: 720px) {
            .mylearna-data-intro {
              padding: 16px !important;
            }

            .mylearna-data-intro p,
            .mylearna-data-helper,
            .mylearna-data-framework-detail,
            .mylearna-data-assessment-evidence,
            .mylearna-data-coverage-helper,
            .mylearna-data-detailed-helper {
              display: none !important;
            }

            .mylearna-data-learner-card,
            .mylearna-data-coverage-card {
              padding: 14px !important;
            }

            .mylearna-data-coverage-card button {
              width: 100% !important;
              min-height: 46px !important;
            }

            .mylearna-data-coverage-row {
              grid-template-columns: 1fr !important;
              align-items: start !important;
            }
          }
        `}</style>
        <CleanWorkflowRibbon />

        <CleanPageIntroVideo
          config={PAGE_INTRO_VIDEOS.myData}
          promptTitle="New to My Data?"
          promptDescription="See current learning, saved work, and report ingredients in one place."
        />

        <section className="mylearna-data-intro" style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>My Data</div>
              <h1 style={{ margin: 0, fontSize: 26, color: "#17204B", fontWeight: 650 }}>
                {selectedLearnerDisplayName
                  ? `${selectedLearnerDisplayName}'s learning overview`
                  : "My Data"}
              </h1>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6, fontSize: 15 }}>
                {selectedLearner
                  ? `${selectedLearnerDisplayName} has ${getEvidenceItemLabel(entries.length)} saved. Use the overview below for the next useful step.`
                  : "See current learning, saved work, pathway progress, and report ingredients in one calm view."}
              </p>
            </div>

            {!workspace.loading &&
            !workspace.schemaMissing &&
            !workspace.requiresFamilyCreation &&
            workspace.profile &&
            workspace.learners.length ? (
              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                <div className="mylearna-data-learner-card" style={compactCardStyle}>
                  <div style={eyebrowStyle}>Current learner</div>
                  <label style={{ color: "#334155", fontWeight: 700 }}>
                    Viewing learning record for
                  </label>
                  <select
                    value={selectedLearnerId}
                    onChange={(event) => setSelectedLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                    All sections below use this learner&apos;s records.
                  </div>
                </div>

                <details className="mylearna-data-framework-detail" style={compactCardStyle}>
                  <summary style={{ cursor: "pointer", color: "#0f172a", fontWeight: 800 }}>
                    Curriculum details
                  </summary>
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    <div style={eyebrowStyle}>Current framework</div>
                    <strong style={{ color: "#0f172a", fontSize: 16 }}>
                      {resolvedFramework.frameworkDisplayLabel}
                    </strong>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      {resolvedFramework.map.description}
                    </div>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      Country / authority:{" "}
                      {resolvedFramework.countryAuthorityLabel ||
                        "Framework details can be adjusted in My Settings."}
                    </div>
                    {!safe(workspace.profile.countryCode) || !safe(workspace.profile.curriculumFrameworkId) ? (
                      <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                        Framework details can be adjusted in My Settings.
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>
            ) : null}

            {!workspace.loading && resolvedFramework.brentContextCard ? (
              <div style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>
                  {resolvedFramework.brentContextCard.title}
                </strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  {resolvedFramework.brentContextCard.copy}
                </p>
              </div>
            ) : null}

          </div>
        </section>

        {workspace.loading ? (
          <V2LoadingState
            title="Preparing My Data"
            body="We are loading curriculum coverage, evidence links, and learning signals."
          />
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              My Data uses your family workspace and evidence records.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.error ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>Workspace error</strong>
            <p style={{ margin: 0, color: "#475569" }}>{workspace.error}</p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile first</h2>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              My Data needs the family workspace first. Set up My Profile before using this page.
            </p>
          </section>
        ) : null}

        {!workspace.loading &&
        !workspace.schemaMissing &&
        !workspace.requiresFamilyCreation &&
        !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Add a learner before using curriculum coverage. My Data is designed to help you understand one learner&apos;s evidence and coverage at a time.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link href="/my-profile" style={buttonStyle}>
                Open My Profile
              </Link>
            </div>
          </section>
        ) : null}

        {!workspace.loading &&
        !workspace.schemaMissing &&
        !workspace.requiresFamilyCreation &&
        workspace.profile &&
        workspace.learners.length ? (
          <>
            {entriesError ? (
              <section style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Evidence loading note</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{entriesError}</p>
              </section>
            ) : null}

            <CleanLearningIntelligenceDashboard
              learnerName={selectedLearnerDisplayName}
              learnerYearLevel={selectedLearner?.yearLevel ?? null}
              frameworkLabel={resolvedFramework.frameworkDisplayLabel}
              evidenceEntries={entries}
              assessmentStatuses={assessmentStatuses}
              assessmentStatusesError={assessmentStatusesError}
              onDownloadCoverageRecord={() => void handleDownloadCoverageRecord()}
              coverageSubmitting={coverageSubmitting}
              coverageMessage={coverageMessage}
              coverageError={coverageError}
            />

            <section className="mylearna-data-assessment-evidence" style={{ ...cardStyle, padding: 18 }}>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={eyebrowStyle}>Progress records</div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Progress observations</h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Saved progress judgements appear here alongside captured work when they can
                    support reporting.
                  </p>
                </div>
                {entriesLoading ? (
                  <p style={{ margin: 0, color: "#475569" }}>Loading progress records...</p>
                ) : progressJudgementObservations.length ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    }}
                  >
                    <div style={{ gridColumn: "1 / -1", color: "#475569", fontSize: 14 }}>
                      <strong style={{ color: "#0f172a" }}>
                        {progressJudgementObservations.length} progress{" "}
                        {progressJudgementObservations.length === 1 ? "judgement" : "judgements"} saved
                      </strong>
                      {progressJudgementObservations[0] ? (
                        <span>
                          {" "}
                          | Latest: {progressJudgementObservations[0].judgement}
                          {progressJudgementObservations[0].dateValue
                            ? ` - ${formatEvidenceEventDateLabel(progressJudgementObservations[0].dateValue)}`
                            : ""}
                        </span>
                      ) : null}
                    </div>
                    {progressJudgementObservations.slice(0, 6).map((observation) => (
                      <article key={observation.id} style={compactCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <strong style={{ color: "#0f172a" }}>{observation.judgement}</strong>
                          <span
                            style={{
                              border: "1px solid #bbf7d0",
                              borderRadius: 999,
                              padding: "4px 9px",
                              background: "#f0fdf4",
                              color: "#166534",
                              fontSize: 12,
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Progress judgement
                          </span>
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                          {formatEvidenceEventDateLabel(observation.dateValue)}
                          {observation.subjectTitle ? ` - ${observation.subjectTitle}` : ""}
                          {observation.strandTitle ? ` - ${observation.strandTitle}` : ""}
                        </div>
                        <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                          {observation.stepTitle
                            ? `Saved for ${observation.stepTitle}.`
                            : "Saved progress judgement for this learner."}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>No progress judgement has been saved yet.</strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Saved progress judgements will appear here when they are available.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section id="coverage-map" style={{ ...cardStyle, padding: 18 }}>
              <div style={{ display: "grid", gap: 12, marginBottom: showDetailedCoverageMap ? 18 : 0 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={eyebrowStyle}>Detailed coverage map</div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Detailed coverage map / reporting support</h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Open this when you need a more detailed curriculum view for reporting checks,
                    evidence placement, or export preparation.
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "#f8fafc",
                        color: "#475569",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {areaSummaries.length} learning areas
                    </span>
                    <span
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "#ffffff",
                        color: "#475569",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {coverageSummary.learningAreasWithEvidenceCount}{" "}
                      {coverageSummary.learningAreasWithEvidenceCount === 1
                        ? "learning area"
                        : "learning areas"}{" "}
                      with evidence
                    </span>
                    <span
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "#ffffff",
                        color: "#475569",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entries.length} {entries.length === 1 ? "learning record" : "learning records"}
                    </span>
                    <span
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "#ffffff",
                        color: "#475569",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {progressJudgementObservations.length} progress{" "}
                      {progressJudgementObservations.length === 1 ? "judgement" : "judgements"}
                    </span>
                    {selectedLearner ? (
                      <span
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#ffffff",
                          color: "#475569",
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Viewing{" "}
                        <strong style={{ color: "#0f172a" }}>
                          {getLearnerLabel(selectedLearner.firstName, selectedLearner.preferredName)}
                        </strong>
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={() => setShowDetailedCoverageMap((current) => !current)}
                  >
                    {showDetailedCoverageMap ? "Hide detailed coverage view" : "Open detailed coverage view"}
                  </button>
                </div>
                {!showDetailedCoverageMap ? (
                  <div className="mylearna-data-detailed-helper" style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>Older reporting support view</strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Closed by default so Learning Intelligence stays front and centre. Open it when you need area-level evidence placement, capture links, or reporting support checks.
                    </p>
                  </div>
                ) : null}
              </div>

              {showDetailedCoverageMap && entriesLoading ? (
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>Loading evidence coverage...</div>
              ) : null}

              {showDetailedCoverageMap ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    className="mylearna-data-coverage-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(180px, 1.5fr) minmax(130px, 0.8fr) minmax(110px, 0.7fr) minmax(140px, 0.9fr) auto",
                      gap: 10,
                      alignItems: "center",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "0 10px",
                    }}
                  >
                    <span>Learning area</span>
                    <span>Status</span>
                    <span>Learning records</span>
                    <span>Latest activity</span>
                    <span aria-hidden="true" />
                  </div>
                  {sortedAreaSummaries.map((summary) => {
                    const tone = getLearningAreaTone(summary.area.key, summary.area.label);
                    const consumerStatus = getConsumerCoverageStatus(summary);
                    const isSelected = summary.area.key === selectedAreaId;
                    const isQuiet = consumerStatus === "Not currently active";

                    return (
                      <article
                        key={summary.area.key}
                        style={{
                          border: isSelected ? `1px solid ${tone.border}` : "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 12,
                          background: isSelected ? tone.selectedBackground : isQuiet ? "#f8fafc" : "#ffffff",
                          display: "grid",
                          gap: isSelected ? 12 : 0,
                        }}
                      >
                        <div
                          className="mylearna-data-coverage-row"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(180px, 1.5fr) minmax(130px, 0.8fr) minmax(110px, 0.7fr) minmax(140px, 0.9fr) auto",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                            <strong style={{ color: "#0f172a" }}>{summary.area.label}</strong>
                            {!isQuiet ? (
                              <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>
                                {summary.area.shortDescription}
                              </span>
                            ) : null}
                          </div>
                          <span
                            style={{
                              border: `1px solid ${isQuiet ? "#e2e8f0" : tone.border}`,
                              background: isQuiet ? "#ffffff" : tone.badgeBackground,
                              color: isQuiet ? "#64748b" : tone.badgeText,
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 800,
                              width: "fit-content",
                            }}
                          >
                            {consumerStatus}
                          </span>
                          <span style={{ color: "#334155", fontWeight: 750 }}>
                            {getEvidenceItemLabel(summary.count)}
                          </span>
                          <span style={{ color: "#64748b", fontSize: 13 }}>
                            {getLatestEvidenceSummary(summary.latestEntry)}
                          </span>
                          <button
                            type="button"
                            style={isSelected ? buttonStyle : secondaryButtonStyle}
                            onClick={() => {
                              setSelectedAreaId(isSelected ? "" : summary.area.key);
                              setSelectedAreaWasChosen(true);
                            }}
                          >
                            {isSelected ? "Hide details" : "View details"}
                          </button>
                        </div>

                        {isSelected ? (
                          <div
                            style={{
                              borderTop: "1px solid #e2e8f0",
                              paddingTop: 12,
                              display: "grid",
                              gap: 12,
                            }}
                          >
                            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                              {summary.area.shortDescription}
                            </p>
                            {isQuiet ? (
                              <div style={helperCardStyle}>
                                <strong style={{ color: "#0f172a" }}>Not currently active</strong>
                                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                  This area is available in the curriculum map, but it is not part of the current pathway or saved records.
                                </p>
                              </div>
                            ) : summary.matchedEntries.length ? (
                              <div style={{ display: "grid", gap: 8 }}>
                                <strong style={{ color: "#0f172a" }}>Recent records</strong>
                                {summary.matchedEntries.slice(0, 3).map((entry) => (
                                  <div
                                    key={entry.id}
                                    style={{
                                      border: "1px solid #e2e8f0",
                                      borderRadius: 12,
                                      padding: 10,
                                      background: "#ffffff",
                                      display: "grid",
                                      gap: 4,
                                    }}
                                  >
                                    <div style={{ color: "#0f172a", fontWeight: 700 }}>
                                      {formatEvidenceTitle(entry)}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
                                      {formatEvidenceDateLabel(entry.observedOn)} - {selectedLearnerDisplayName}
                                    </div>
                                    <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.5 }}>
                                      {formatEvidenceSnippet(entry)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <div>
                              <Link
                                href={buildCaptureHref({
                                  learningAreaKey: summary.area.key,
                                  learningAreaLabel: summary.area.label,
                                })}
                                style={isQuiet ? secondaryButtonStyle : buttonStyle}
                              >
                                Add a learning record
                              </Link>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>

            {showDetailedCoverageMap && supplementaryEvidenceAreas.length ? (
            <section style={{ ...cardStyle, background: "#fcfdff" }}>
              <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={eyebrowStyle}>Reporting support</div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>{resolvedFramework.supplementarySectionTitle}</h2>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span
                      style={{
                        border: brentModeActive ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                        background: brentModeActive ? "#eff6ff" : "#f8fafc",
                        color: brentModeActive ? "#1d4ed8" : "#64748b",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {brentModeActive
                        ? "Active for this family"
                        : reportingEvidenceAreasActive
                          ? "Included in this framework"
                          : "Available when selected in My Settings"}
                    </span>
                    <span
                      style={{
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        color: "#475569",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {authorityAreaSummaries.length} areas
                    </span>
                    <span
                      style={{
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        color: "#475569",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {authorityAreasWithEvidenceCount} with evidence
                    </span>
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() => setShowAuthorityAreas((current) => !current)}
                    >
                      {supplementaryAreasExpanded ? "Collapse support areas" : "Expand support areas"}
                    </button>
                  </div>
                </div>
              </div>

              {!supplementaryAreasExpanded ? (
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Reporting evidence areas</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Open this section when you want to explore how evidence can support review,
                    reporting, and authority-aligned expectations without crowding the main
                    coverage map.
                  </p>
                </div>
              ) : null}

              {supplementaryAreasExpanded ? (
                <>
                  <p style={{ margin: "0 0 16px", color: "#475569", lineHeight: 1.7 }}>
                    {resolvedFramework.supplementarySectionCopy}
                  </p>

                  {brentModeActive ? (
                    <div style={{ ...helperCardStyle, marginBottom: 16 }}>
                      <strong style={{ color: "#0f172a" }}>Authority pathway active</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Brent-aligned reporting support is active for this family, so these
                        areas are shown as part of the evidence map.
                      </p>
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "grid",
                      gap: 14,
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    }}
                  >
                    {authorityAreaSummaries.map((summary) => (
                      <article
                        key={summary.area.key}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: 16,
                          display: "grid",
                          gap: 12,
                          background: "#ffffff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                          <strong style={{ color: "#0f172a", fontSize: 16 }}>{summary.area.label}</strong>
                          <span
                            style={{
                              ...coverageBadgeStyle(summary.status),
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {summary.status}
                          </span>
                        </div>

                        <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                          {summary.area.shortDescription}
                        </div>

                        <div style={{ display: "grid", gap: 4, color: "#475569", lineHeight: 1.6 }}>
                          <div>
                            <strong style={{ color: "#0f172a" }}>{getEvidenceItemLabel(summary.count)}</strong>
                          </div>
                          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                            Latest evidence: {getLatestEvidenceSummary(summary.latestEntry)}
                          </div>
                        </div>

                        {summary.matchedEntries.length ? (
                          <div
                            style={{
                              borderTop: "1px solid #e2e8f0",
                              paddingTop: 10,
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            <strong style={{ color: "#0f172a", fontSize: 13 }}>
                              Linked evidence
                            </strong>
                            {summary.matchedEntries.slice(0, 2).map((entry) => (
                              <div
                                key={entry.id}
                                style={{
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 12,
                                  padding: 10,
                                  background: "#f8fafc",
                                  display: "grid",
                                  gap: 4,
                                }}
                              >
                                <div style={{ color: "#0f172a", fontWeight: 700 }}>
                                  {formatEvidenceTitle(entry)}
                                </div>
                                <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
                                  {formatEvidenceDateLabel(entry.observedOn)} - {selectedLearnerDisplayName}
                                </div>
                                <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.5 }}>
                                  {formatEvidenceSnippet(entry)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <Link
                          href={buildCaptureHref({
                            authorityEvidenceAreaKey: summary.area.key,
                            authorityEvidenceAreaLabel: summary.area.label,
                          })}
                          style={secondaryButtonStyle}
                        >
                          Capture evidence
                        </Link>
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
            ) : null}

          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanCurriculumWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CurriculumWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}

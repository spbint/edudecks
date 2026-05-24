"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanLearningIntelligenceDashboard from "@/app/components/clean/CleanLearningIntelligenceDashboard";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
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
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { resolveCurriculumFrameworkMap } from "@/lib/clean/curriculum/frameworkMaps";
import {
  buildCurriculumCoverageSummary,
  type CurriculumCoverageAssessmentSummary,
  type CurriculumCoverageStatus,
} from "@/lib/clean/curriculum/coverageSummary";
import {
  buildCurriculumCoveragePdfFilename,
  buildCurriculumCoveragePdfModel,
  CURRICULUM_COVERAGE_EMPTY_COPY,
  generateCurriculumCoveragePdfBytes,
} from "@/lib/clean/outputs/curriculumCoveragePdf";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 16,
  background: "#f8fbff",
  padding: 16,
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

function formatEvidenceSnippet(entry: CleanEvidenceEntry) {
  const snippet = safe(entry.whatHappened) || safe(entry.reflection);
  if (!snippet) return "No short note recorded yet.";
  if (snippet.length <= 110) return snippet;
  return `${snippet.slice(0, 107)}...`;
}

function getEvidenceItemLabel(count: number) {
  return `${count} evidence ${count === 1 ? "item" : "items"}`;
}

function getAssessmentSummaryLine(summary: CurriculumCoverageAssessmentSummary) {
  const secureOrStrong = summary.secure + summary.strong;
  const developing = summary.developing + summary.stillDeveloping;

  return `${summary.assessedCount} assessed | ${secureOrStrong} secure/strong | ${developing} developing/still developing`;
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
  const [showAuthorityAreas, setShowAuthorityAreas] = useState(false);
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
            "We could not load pathway-linked assessment confidence just now.",
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

  useEffect(() => {
    if (!areaSummaries.length) {
      setSelectedAreaId("");
      return;
    }

    const hasCurrentSelection = areaSummaries.some((item) => item.area.key === selectedAreaId);
    if (hasCurrentSelection) return;

    const firstWithEvidence = areaSummaries.find((item) => item.count > 0);
    setSelectedAreaId(firstWithEvidence?.area.key || areaSummaries[0]?.area.key || "");
  }, [areaSummaries, selectedAreaId]);

  const selectedAreaSummary =
    areaSummaries.find((item) => item.area.key === selectedAreaId) ?? areaSummaries[0] ?? null;
  const selectedAreaTone = selectedAreaSummary
    ? getLearningAreaTone(selectedAreaSummary.area.key, selectedAreaSummary.area.label)
    : null;

  const selectedAreaElementSummaries = selectedAreaSummary?.elementSummaries ?? [];
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
  const hasLinkedEvidence = coverageSummary.hasLinkedEvidence;

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
        buildCurriculumCoveragePdfFilename(model.learnerName, model.generatedOnLabel),
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
        <CleanWorkflowRibbon />

        <section style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Connected overview</div>
              <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>
                Learning Intelligence
              </h1>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 16 }}>
                A clear overview of learner progress across pathways, assessment confidence,
                evidence, curriculum coverage, portfolio support, and reporting readiness.
              </p>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
                This dashboard sits inside My Curriculum and reads the same canonical pathway
                spine already used by My Pathways, My Assessments, and My Capture.
              </p>
            </div>

            <div style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>What does this learning show?</strong>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Use Learning Intelligence to see where evidence is building, where confidence has
                been saved, and which learning areas may benefit from the next calm step.
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
                <div style={compactCardStyle}>
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
                  <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                    Map type: {resolvedFramework.mapTypeLabel}
                  </div>
                  <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                    {resolvedFramework.helperCopy}
                  </div>
                  {!safe(workspace.profile.countryCode) || !safe(workspace.profile.curriculumFrameworkId) ? (
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                      Framework details can be adjusted in My Settings.
                    </div>
                  ) : null}
                </div>

                <div style={compactCardStyle}>
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
                    Coverage stays exploratory here. Your capture and portfolio workflow remains unchanged.
                  </div>
                </div>
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

            {!workspace.loading &&
            !workspace.schemaMissing &&
            !workspace.requiresFamilyCreation &&
            workspace.profile &&
            workspace.learners.length ? (
              <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                {resolvedFramework.helperCopy} {resolvedFramework.settingsHint}
              </div>
            ) : null}
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading curriculum view...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              My Curriculum uses the clean family workspace and evidence records.
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
              My Curriculum needs the family workspace first. Set up My Profile before using this page.
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
              Add a learner before using curriculum coverage. My Curriculum is designed to help you understand one learner&apos;s evidence and coverage at a time.
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

            <section id="coverage-map" style={cardStyle}>
              <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Reporting support view</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Use this lower section when you want the detailed curriculum view for
                    coverage, evidence placement, export, and reporting support.
                  </p>
                </div>
                <div style={eyebrowStyle}>Detailed coverage map</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Curriculum coverage detail</h2>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Open a learning area when you want the detailed coverage and reporting view.
                    </p>
                  </div>

                  {selectedLearner ? (
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 999,
                        padding: "8px 12px",
                        background: "#f8fafc",
                        color: "#475569",
                        lineHeight: 1.6,
                      }}
                    >
                      Viewing{" "}
                      <strong style={{ color: "#0f172a" }}>
                        {getLearnerLabel(selectedLearner.firstName, selectedLearner.preferredName)}
                      </strong>
                    </div>
                  ) : null}
                </div>
              </div>

              {entriesLoading ? (
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>Loading evidence coverage...</div>
              ) : null}

              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                {areaSummaries.map((summary) => {
                  const tone = getLearningAreaTone(summary.area.key, summary.area.label);
                  const isSelected = summary.area.key === selectedAreaId;

                  return (
                    <article
                      key={summary.area.key}
                      style={{
                        border: isSelected
                          ? `1px solid ${tone.border}`
                          : `1px solid ${tone.mutedBorder}`,
                        borderRadius: 16,
                        padding: 14,
                        background: isSelected ? tone.selectedBackground : tone.softBackground,
                        display: "grid",
                        gap: 10,
                        boxShadow: isSelected ? tone.shadow : "none",
                      }}
                    >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              background: tone.accent,
                              boxShadow: `0 0 0 4px ${tone.badgeBackground}`,
                            }}
                          />
                          <strong style={{ color: "#0f172a", fontSize: 16 }}>{summary.area.label}</strong>
                          {isSelected ? (
                            <span
                              style={{
                                border: `1px solid ${tone.border}`,
                                background: tone.badgeBackground,
                                color: tone.badgeText,
                                borderRadius: 999,
                                padding: "4px 8px",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              Selected area
                            </span>
                          ) : null}
                        </div>
                        <div style={{ color: "#64748b", lineHeight: 1.5, fontSize: 14 }}>
                          {summary.area.shortDescription}
                        </div>
                      </div>
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

                    <div style={{ display: "grid", gap: 4, color: "#475569", lineHeight: 1.6 }}>
                      <div>
                        <strong style={{ color: "#0f172a" }}>{getEvidenceItemLabel(summary.count)}</strong>
                      </div>
                      {summary.assessmentSummary.totalSteps > 0 ? (
                        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                          Assessment: {getAssessmentSummaryLine(summary.assessmentSummary)}
                        </div>
                      ) : null}
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        Latest evidence:{" "}
                        {summary.latestEntry
                          ? `${formatEvidenceTitle(summary.latestEntry)} - ${formatEvidenceDateLabel(summary.latestEntry.observedOn)}`
                          : "No evidence linked yet."}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={isSelected ? buttonStyle : secondaryButtonStyle}
                      onClick={() => setSelectedAreaId(summary.area.key)}
                    >
                      View area
                    </button>
                    </article>
                  );
                })}
              </div>
            </section>

            {selectedAreaSummary ? (
              <section style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 18,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
                    <div style={eyebrowStyle}>Selected area</div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>
                      Area detail: {selectedAreaSummary.area.label}
                    </h2>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                      Look across the elements below to see where evidence is already forming and where you may want to capture more.
                    </p>
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                      {selectedAreaSummary.area.shortDescription}
                    </div>
                  </div>

                  <div
                    style={{
                      ...compactCardStyle,
                      minWidth: 0,
                      width: "min(320px, 100%)",
                      maxWidth: 320,
                      border: `1px solid ${selectedAreaTone?.border ?? "#bfdbfe"}`,
                      background: selectedAreaTone?.selectedBackground ?? "#f8fbff",
                    }}
                  >
                    <span
                      style={{
                        ...coverageBadgeStyle(selectedAreaSummary.status),
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        justifySelf: "start",
                      }}
                    >
                      {selectedAreaSummary.status}
                    </span>
                    <div style={{ color: "#0f172a", fontWeight: 800 }}>
                      {getEvidenceItemLabel(selectedAreaSummary.count)}
                    </div>
                    {selectedAreaSummary.assessmentSummary.totalSteps > 0 ? (
                      <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                        Assessment: {getAssessmentSummaryLine(selectedAreaSummary.assessmentSummary)}
                      </div>
                    ) : null}
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                      Latest evidence:{" "}
                      {selectedAreaSummary.latestEntry
                        ? `${formatEvidenceTitle(selectedAreaSummary.latestEntry)} - ${formatEvidenceDateLabel(selectedAreaSummary.latestEntry.observedOn)}`
                        : "No evidence linked yet."}
                    </div>
                    <Link
                      href={buildCaptureHref({
                        learningAreaKey: selectedAreaSummary.area.key,
                        learningAreaLabel: selectedAreaSummary.area.label,
                      })}
                      style={buttonStyle}
                    >
                      Capture evidence
                    </Link>
                  </div>
                </div>

                {selectedAreaElementSummaries.length ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 14,
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    }}
                  >
                    {selectedAreaElementSummaries.map((summary) => (
                      <article
                        key={summary.element.key}
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
                          <strong style={{ color: "#0f172a", fontSize: 16 }}>{summary.element.label}</strong>
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
                          {summary.element.shortDescription}
                        </div>

                        <div style={{ display: "grid", gap: 4, color: "#475569", lineHeight: 1.6 }}>
                          <div>
                            <strong style={{ color: "#0f172a" }}>{getEvidenceItemLabel(summary.count)}</strong>
                          </div>
                          {summary.assessmentSummary.totalSteps > 0 ? (
                            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                              Assessment: {getAssessmentSummaryLine(summary.assessmentSummary)}
                            </div>
                          ) : null}
                          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                            Latest evidence:{" "}
                            {summary.latestEntry
                              ? `${formatEvidenceTitle(summary.latestEntry)} - ${formatEvidenceDateLabel(summary.latestEntry.observedOn)}`
                              : "No evidence linked yet."}
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
                            learningAreaKey: selectedAreaSummary.area.key,
                            learningAreaLabel: selectedAreaSummary.area.label,
                            curriculumElementKey: summary.element.key,
                            curriculumElementLabel: summary.element.label,
                          })}
                          style={buttonStyle}
                        >
                          Capture evidence
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>Foundation view</strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      This area will gain more detailed curriculum elements in a later pass. For now, capture evidence using the broad learning area.
                    </p>
                    <div>
                      <Link
                        href={buildCaptureHref({
                          learningAreaKey: selectedAreaSummary.area.key,
                          learningAreaLabel: selectedAreaSummary.area.label,
                        })}
                        style={buttonStyle}
                      >
                        Capture evidence
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            {supplementaryEvidenceAreas.length ? (
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
                            Latest evidence:{" "}
                            {summary.latestEntry
                              ? `${formatEvidenceTitle(summary.latestEntry)} - ${formatEvidenceDateLabel(summary.latestEntry.observedOn)}`
                              : "No evidence linked yet."}
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

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Curriculum Coverage Record</h2>
                    <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                      Export a curriculum coverage record showing learning areas, evidence links, and areas to revisit. Useful for reporting, review, and portfolio preparation.
                    </p>
                  </div>
                </div>
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Download coverage record</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    This uses My Curriculum evidence links and your selected framework from My Settings.
                  </p>
                  {!hasLinkedEvidence ? (
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      {CURRICULUM_COVERAGE_EMPTY_COPY}
                    </div>
                  ) : null}
                  {coverageError ? (
                    <div style={{ color: "#b91c1c", lineHeight: 1.6 }}>{coverageError}</div>
                  ) : null}
                  {coverageMessage ? (
                    <div style={{ color: "#1d4ed8", lineHeight: 1.6 }}>{coverageMessage}</div>
                  ) : null}
                  <div>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => void handleDownloadCoverageRecord()}
                      disabled={!selectedLearner || coverageSubmitting}
                    >
                      {coverageSubmitting ? "Preparing record..." : "Download coverage record"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
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

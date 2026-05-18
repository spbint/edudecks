"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildCurriculumCaptureContext,
  buildCurriculumCaptureSearchParams,
  parseCurriculumContextFromNodeIds,
  type CleanCurriculumCaptureContext,
} from "@/lib/clean/evidence/curriculumContext";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  resolveCurriculumFrameworkMap,
  type CurriculumFrameworkElement,
  type CurriculumFrameworkEvidenceArea,
  type CurriculumFrameworkLearningArea,
} from "@/lib/clean/curriculum/frameworkMaps";

type CoverageStatus = "No evidence yet" | "Evidence started" | "Evidence building";

type EvidenceMatchSummary = {
  count: number;
  status: CoverageStatus;
  latestEntry: CleanEvidenceEntry | null;
};

type DetailedEvidenceMatchSummary = EvidenceMatchSummary & {
  matchedEntries: CleanEvidenceEntry[];
};

type EvidenceEntryWithCurriculumContext = {
  entry: CleanEvidenceEntry;
  curriculumContext: CleanCurriculumCaptureContext | null;
};

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
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

const summaryStripStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 8,
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
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

function evidenceSortValue(entry: CleanEvidenceEntry) {
  return Date.parse(`${entry.observedOn}T00:00:00`) || Date.parse(entry.updatedAt || "") || 0;
}

function getCoverageStatus(count: number): CoverageStatus {
  if (count <= 0) return "No evidence yet";
  if (count <= 2) return "Evidence started";
  return "Evidence building";
}

function coverageBadgeStyle(status: CoverageStatus): React.CSSProperties {
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

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function buildEvidenceSearchText(entry: CleanEvidenceEntry) {
  return [
    safe(entry.learningArea),
    safe(entry.title),
    safe(entry.whatHappened),
    safe(entry.reflection),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function buildDetailedMatchSummary(entries: CleanEvidenceEntry[]): DetailedEvidenceMatchSummary {
  const matchedEntries = [...entries].sort(
    (left, right) => evidenceSortValue(right) - evidenceSortValue(left),
  );

  return {
    matchedEntries,
    count: matchedEntries.length,
    status: getCoverageStatus(matchedEntries.length),
    latestEntry: matchedEntries[0] ?? null,
  };
}

function matchesLearningAreaConfig(
  entry: CleanEvidenceEntry,
  curriculumContext: CleanCurriculumCaptureContext | null,
  area: CurriculumFrameworkLearningArea,
) {
  if (safe(curriculumContext?.learningAreaKey)) {
    const learningAreaKey = safe(curriculumContext?.learningAreaKey);
    return (
      learningAreaKey === area.key ||
      area.legacyKeys?.includes(learningAreaKey) === true
    );
  }

  if (safe(curriculumContext?.learningAreaLabel)) {
    const learningAreaLabel = safe(curriculumContext?.learningAreaLabel);
    return (
      learningAreaLabel === area.label ||
      area.legacyLabels?.includes(learningAreaLabel) === true
    );
  }

  if (curriculumContext) {
    return false;
  }

  if (
    safe(entry.learningArea).toLowerCase() === area.label.toLowerCase() ||
    area.legacyLabels?.some(
      (legacyLabel) => safe(entry.learningArea).toLowerCase() === legacyLabel.toLowerCase(),
    )
  ) {
    return true;
  }

  return matchesAnyKeyword(buildEvidenceSearchText(entry), area.keywords);
}

function matchesCurriculumElementConfig(
  entry: CleanEvidenceEntry,
  curriculumContext: CleanCurriculumCaptureContext | null,
  area: CurriculumFrameworkLearningArea,
  element: CurriculumFrameworkElement,
) {
  if (safe(curriculumContext?.curriculumElementKey)) {
    const curriculumElementKey = safe(curriculumContext?.curriculumElementKey);
    return (
      curriculumElementKey === element.key ||
      element.legacyKeys?.includes(curriculumElementKey) === true
    );
  }

  if (safe(curriculumContext?.curriculumElementLabel)) {
    const curriculumElementLabel = safe(curriculumContext?.curriculumElementLabel);
    return (
      curriculumElementLabel === element.label ||
      element.legacyLabels?.includes(curriculumElementLabel) === true
    );
  }

  if (!matchesLearningAreaConfig(entry, curriculumContext, area)) {
    return false;
  }

  return matchesAnyKeyword(buildEvidenceSearchText(entry), element.keywords);
}

function matchesAuthorityEvidenceAreaConfig(
  entry: CleanEvidenceEntry,
  curriculumContext: CleanCurriculumCaptureContext | null,
  area: CurriculumFrameworkEvidenceArea,
) {
  if (safe(curriculumContext?.authorityEvidenceAreaKey)) {
    const authorityEvidenceAreaKey = safe(curriculumContext?.authorityEvidenceAreaKey);
    return (
      authorityEvidenceAreaKey === area.key ||
      area.legacyKeys?.includes(authorityEvidenceAreaKey) === true
    );
  }

  if (safe(curriculumContext?.authorityEvidenceAreaLabel)) {
    const authorityEvidenceAreaLabel = safe(curriculumContext?.authorityEvidenceAreaLabel);
    return (
      authorityEvidenceAreaLabel === area.label ||
      area.legacyLabels?.includes(authorityEvidenceAreaLabel) === true
    );
  }

  if (curriculumContext) {
    return false;
  }

  return matchesAnyKeyword(buildEvidenceSearchText(entry), area.keywords);
}

function CurriculumWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [entries, setEntries] = useState<CleanEvidenceEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [showAuthorityAreas, setShowAuthorityAreas] = useState(false);

  const capturePathBase = pathname.startsWith("/clean-my-curriculum")
    ? "/clean-my-capture"
    : "/my-capture";
  const resolvedFramework = useMemo(
    () => resolveCurriculumFrameworkMap(workspace.profile),
    [workspace.profile],
  );
  const brentModeActive = resolvedFramework.authorityOverlayActive;
  const activeLearningAreas = resolvedFramework.map.learningAreas;
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

  const selectedLearner = useMemo(
    () =>
      workspace.learners.find((learner) => learner.id === selectedLearnerId) ?? null,
    [selectedLearnerId, workspace.learners],
  );
  const entriesWithCurriculumContext = useMemo<EvidenceEntryWithCurriculumContext[]>(
    () =>
      entries.map((entry) => ({
        entry,
        curriculumContext: parseCurriculumContextFromNodeIds(entry.curriculumNodeIds),
      })),
    [entries],
  );

  const areaSummaries = useMemo(() => {
    return activeLearningAreas.map((area) => {
      const matchedEntries = entriesWithCurriculumContext
        .filter(({ entry, curriculumContext }) =>
          matchesLearningAreaConfig(entry, curriculumContext, area),
        )
        .map(({ entry }) => entry);
      const summary = buildDetailedMatchSummary(matchedEntries);

      return {
        area,
        ...summary,
      };
    });
  }, [activeLearningAreas, entriesWithCurriculumContext]);

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

  const selectedAreaElementSummaries = useMemo(() => {
    if (!selectedAreaSummary) return [];

    return selectedAreaSummary.area.elements.map((element) => {
      const matchedEntries = entriesWithCurriculumContext
        .filter(({ entry, curriculumContext }) =>
          matchesCurriculumElementConfig(
            entry,
            curriculumContext,
            selectedAreaSummary.area,
            element,
          ),
        )
        .map(({ entry }) => entry);
      return {
        element,
        ...buildDetailedMatchSummary(matchedEntries),
      };
    });
  }, [entriesWithCurriculumContext, selectedAreaSummary]);

  const authorityAreaSummaries = useMemo(() => {
    return supplementaryEvidenceAreas.map((area) => {
      const matchedEntries = entriesWithCurriculumContext
        .filter(({ entry, curriculumContext }) =>
          matchesAuthorityEvidenceAreaConfig(entry, curriculumContext, area),
        )
        .map(({ entry }) => entry);
      return {
        area,
        ...buildDetailedMatchSummary(matchedEntries),
      };
    });
  }, [entriesWithCurriculumContext, supplementaryEvidenceAreas]);

  const learningAreasWithEvidenceCount = useMemo(
    () => areaSummaries.filter((summary) => summary.count > 0).length,
    [areaSummaries],
  );

  const areasToRevisitCount = useMemo(
    () => areaSummaries.filter((summary) => summary.count === 0).length,
    [areaSummaries],
  );

  const authorityAreasWithEvidenceCount = useMemo(
    () => authorityAreaSummaries.filter((summary) => summary.count > 0).length,
    [authorityAreaSummaries],
  );
  const reportingEvidenceAreasActive = Boolean(
    resolvedFramework.map.reportingEvidenceAreas?.length,
  );
  const supplementaryAreasExpanded =
    brentModeActive || reportingEvidenceAreasActive || showAuthorityAreas;
  const selectedLearnerDisplayName = selectedLearner
    ? getLearnerLabel(selectedLearner.firstName, selectedLearner.preferredName)
    : "Learner";

  useEffect(() => {
    if (brentModeActive || reportingEvidenceAreasActive) {
      setShowAuthorityAreas(true);
    }
  }, [brentModeActive, reportingEvidenceAreasActive]);

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

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanAppHeader />

        <section style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Learning areas and evidence</div>
              <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>My Curriculum</h1>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 16 }}>
                See what learning areas are being covered, where evidence is building, and where you may want to capture more.
              </p>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
                This is a supporting layer. It does not replace My Capture, My Portfolio, My Reports, or My Outputs.
              </p>
            </div>

            <div style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>What does this learning show?</strong>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Use My Curriculum to connect everyday learning with curriculum areas, reporting expectations, and your child&apos;s learning record.
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

            <section style={summaryStripStyle}>
              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Learning areas with evidence
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {learningAreasWithEvidenceCount}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Evidence building across {activeLearningAreas.length} broad learning areas.
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Evidence entries linked
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {entriesLoading ? "..." : entries.length}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {entries.length
                    ? "Ready for reports as evidence continues to build."
                    : "Foundation view while evidence begins to build."}
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Areas to revisit
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {areasToRevisitCount}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Learning areas with no evidence yet for this learner.
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  {resolvedFramework.supplementaryMetricLabel}
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {supplementaryEvidenceAreas.length ? authorityAreasWithEvidenceCount : 0}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {resolvedFramework.supplementaryMetricCopy}
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                <div style={eyebrowStyle}>Coverage map</div>
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
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Learning area coverage</h2>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Scan the broad learning areas first, then open one area to decide where you may want to capture more.
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
                {areaSummaries.map((summary) => (
                  <article
                    key={summary.area.key}
                    style={{
                      border: summary.area.key === selectedAreaId ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 14,
                      background: summary.area.key === selectedAreaId ? "#f8fbff" : "#ffffff",
                      display: "grid",
                      gap: 10,
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
                          <strong style={{ color: "#0f172a", fontSize: 16 }}>{summary.area.label}</strong>
                          {summary.area.key === selectedAreaId ? (
                            <span
                              style={{
                                border: "1px solid #bfdbfe",
                                background: "#eff6ff",
                                color: "#1d4ed8",
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
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        Latest evidence:{" "}
                        {summary.latestEntry
                          ? `${formatEvidenceTitle(summary.latestEntry)} - ${formatEvidenceDateLabel(summary.latestEntry.observedOn)}`
                          : "No evidence linked yet."}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={summary.area.key === selectedAreaId ? buttonStyle : secondaryButtonStyle}
                      onClick={() => setSelectedAreaId(summary.area.key)}
                    >
                      View area
                    </button>
                  </article>
                ))}
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

                  <div style={{ ...compactCardStyle, minWidth: 240, maxWidth: 320 }}>
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
                </div>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {resolvedFramework.supplementarySectionCopy}
                </p>
              </div>

              {brentModeActive ? (
                <div style={{ ...helperCardStyle, marginBottom: 16 }}>
                  <strong style={{ color: "#0f172a" }}>Authority pathway active</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Brent-aligned reporting support is active for this family, so these areas are shown as part of the evidence map.
                  </p>
                </div>
              ) : null}

              {!supplementaryAreasExpanded ? (
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Available when selected in My Settings</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Open these areas when you want to explore how evidence can support authority-aligned review and reporting expectations.
                  </p>
                  <div>
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() => setShowAuthorityAreas(true)}
                    >
                      Show support areas
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {!brentModeActive && !reportingEvidenceAreasActive ? (
                    <div style={{ marginBottom: 16 }}>
                      <button
                        type="button"
                        style={secondaryButtonStyle}
                        onClick={() => setShowAuthorityAreas(false)}
                      >
                        Hide support areas
                      </button>
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
              )}
            </section>
            ) : null}

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Curriculum Coverage PDF</h2>
                    <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                      Export a curriculum coverage record showing learning areas, evidence links, and areas to revisit. Useful for reporting, review, and portfolio preparation.
                    </p>
                  </div>
                  <span
                    style={{
                      border: "1px solid #c7d2fe",
                      background: "#eef2ff",
                      color: "#4338ca",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Coming later
                  </span>
                </div>
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Coming later</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Curriculum coverage export will arrive in a later pass once the evidence view and area mapping have settled into a stronger family workflow.
                  </p>
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

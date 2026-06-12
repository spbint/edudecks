"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import {
  GuidancePageAction,
  GuidanceSetupProgress,
  GuidanceSetupNextAction,
} from "@/app/components/clean/guidance/GuidanceToggle";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  deleteCleanEvidenceEntry,
} from "@/lib/clean/evidence/client";
import {
  createCleanPortfolioHighlight,
  deleteCleanPortfolioHighlight,
  listCleanPortfolioItems,
} from "@/lib/clean/portfolio/client";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
import { parseAssessmentEvidenceLinkFromNodeIds } from "@/lib/clean/assessments/client";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type { CleanProgram, CleanProgramSegment } from "@/lib/clean/programs/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1080,
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
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function portfolioCardTitle(item: CleanPortfolioItem) {
  return item.evidence.title || item.evidence.whatHappened;
}

function sortPortfolioItems(items: CleanPortfolioItem[]) {
  return [...items].sort((left, right) => {
    if (left.isHighlighted !== right.isHighlighted) {
      return left.isHighlighted ? 1 : -1;
    }

    const observedCompare = right.evidence.observedOn.localeCompare(left.evidence.observedOn);
    if (observedCompare !== 0) return observedCompare;

    const leftCreated = Date.parse(left.evidence.createdAt || left.evidence.updatedAt || "");
    const rightCreated = Date.parse(right.evidence.createdAt || right.evidence.updatedAt || "");

    if (!Number.isNaN(leftCreated) || !Number.isNaN(rightCreated)) {
      if (Number.isNaN(leftCreated)) return 1;
      if (Number.isNaN(rightCreated)) return -1;
      if (leftCreated !== rightCreated) return rightCreated - leftCreated;
    }

    return left.evidence.id.localeCompare(right.evidence.id);
  });
}

type PathwayStepEvidenceMeta = {
  key: string;
  label: string;
  assessmentConfidence: string | null;
  observedSkillStatus: string | null;
};

function getPathwayStepEvidenceMeta(item: CleanPortfolioItem): PathwayStepEvidenceMeta | null {
  const context = parsePathwayContextFromNodeIds(item.evidence.curriculumNodeIds);
  if (!context?.stepNumber || !context.stepTitle) return null;
  const assessmentLink = parseAssessmentEvidenceLinkFromNodeIds(item.evidence.curriculumNodeIds);

  return {
    key:
      [
        item.evidence.learnerId,
        context.pathwayStepId,
      ]
        .filter(Boolean)
        .join("::") ||
      [
        item.evidence.learnerId,
        context.pathwayKey || context.pathwayLabel || "pathway",
        context.stageKey || context.stageLabel || "stage",
        context.stepNumber,
      ].join("::"),
    label: `Step ${context.stepNumber} - ${context.stepTitle}`,
    assessmentConfidence: assessmentLink?.assessmentStatus || null,
    observedSkillStatus: context.observedSkillStatus || null,
  };
}

function CleanPortfolioWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedLearningArea, setSelectedLearningArea] = useState("");
  const [selectionFilter, setSelectionFilter] = useState<
    "all" | "selected" | "not-selected"
  >("all");
  const [pathwayFilter, setPathwayFilter] = useState<
    "all" | "pathway-only" | "repeated-step"
  >("all");
  const [items, setItems] = useState<CleanPortfolioItem[]>([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [calendarItems, setCalendarItems] = useState<CleanCalendarItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<CleanPortfolioItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const capturePathBase = pathname.startsWith("/clean-my-portfolio")
    ? "/clean-my-capture"
    : "/my-capture";
  const reportsPathBase = pathname.startsWith("/clean-my-portfolio")
    ? "/clean-my-reports"
    : "/my-reports";

  const programLabelById = useMemo(
    () => new Map(programs.map((program) => [program.id, program.title])),
    [programs],
  );

  const segmentLabelById = useMemo(
    () => new Map(programSegments.map((segment) => [segment.id, segment.title])),
    [programSegments],
  );

  const calendarItemById = useMemo(
    () => new Map(calendarItems.map((item) => [item.id, item])),
    [calendarItems],
  );
  const learningAreaOptions = useMemo(
    () =>
      [...new Set(items.map((item) => (item.evidence.learningArea || "").trim()).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right)),
    [items],
  );
  const pathwayEvidenceSummary = useMemo(() => {
    const stepByEvidenceId = new Map<string, PathwayStepEvidenceMeta>();
    const stepCounts = new Map<string, { label: string; count: number }>();

    for (const item of items) {
      const meta = getPathwayStepEvidenceMeta(item);
      if (!meta) continue;

      stepByEvidenceId.set(item.evidence.id, meta);
      const current = stepCounts.get(meta.key);
      stepCounts.set(meta.key, {
        label: meta.label,
        count: current ? current.count + 1 : 1,
      });
    }

    const repeatedSteps = [...stepCounts.values()].filter((step) => step.count > 1);

    return {
      stepByEvidenceId,
      stepCounts,
      repeatedSteps,
    };
  }, [items]);
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const pathwayMeta = pathwayEvidenceSummary.stepByEvidenceId.get(item.evidence.id) ?? null;
      const repeatedPathwayStep = pathwayMeta
        ? (pathwayEvidenceSummary.stepCounts.get(pathwayMeta.key)?.count ?? 0) > 1
        : false;

      if (
        selectedLearningArea &&
        (item.evidence.learningArea || "").trim() !== selectedLearningArea
      ) {
        return false;
      }

      if (selectionFilter === "selected" && !item.isHighlighted) return false;
      if (selectionFilter === "not-selected" && item.isHighlighted) return false;

      if (pathwayFilter === "pathway-only" && !pathwayMeta) return false;
      if (pathwayFilter === "repeated-step" && !repeatedPathwayStep) return false;

      if (!normalizedSearch) return true;

      const searchHaystack = [
        item.evidence.title,
        item.evidence.whatHappened,
        item.evidence.reflection,
        item.evidence.learningArea,
        pathwayMeta?.label,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      return searchHaystack.includes(normalizedSearch);
    });
  }, [
    items,
    pathwayEvidenceSummary.stepByEvidenceId,
    pathwayEvidenceSummary.stepCounts,
    pathwayFilter,
    searchText,
    selectedLearningArea,
    selectionFilter,
  ]);
  const sortedFilteredItems = useMemo(
    () => sortPortfolioItems(filteredItems),
    [filteredItems],
  );
  const filteredPathwayEvidenceSummary = useMemo(() => {
    const stepByEvidenceId = new Map<string, PathwayStepEvidenceMeta>();
    const stepCounts = new Map<string, { label: string; count: number }>();

    for (const item of filteredItems) {
      const meta = getPathwayStepEvidenceMeta(item);
      if (!meta) continue;

      stepByEvidenceId.set(item.evidence.id, meta);
      const current = stepCounts.get(meta.key);
      stepCounts.set(meta.key, {
        label: meta.label,
        count: current ? current.count + 1 : 1,
      });
    }

    const repeatedSteps = [...stepCounts.values()].filter((step) => step.count > 1);

    return {
      stepByEvidenceId,
      stepCounts,
      repeatedSteps,
    };
  }, [filteredItems]);

  const reloadItems = useCallback(async () => {
    if (!workspace.profile) return;

    setItemsLoading(true);
    setItemsError(null);
    try {
      const [nextItems, nextPrograms, nextCalendarItems] = await Promise.all([
        listCleanPortfolioItems(workspace.profile.id, {
          learnerId: selectedLearnerId || null,
          limit: 50,
        }),
        listCleanPrograms(workspace.profile.id, { limit: 50 }),
        listCleanCalendarItems(workspace.profile.id, { limit: 80 }),
      ]);

      const nextProgramSegments = (
        await Promise.all(
          nextPrograms.map((program) =>
            listCleanProgramSegments(workspace.profile!.id, program.id),
          ),
        )
      ).flat();

      setItems(nextItems);
      setPrograms(nextPrograms);
      setProgramSegments(nextProgramSegments);
      setCalendarItems(nextCalendarItems);
    } catch (error) {
      setItemsError(
        normalizeCleanErrorMessage(
          error,
          "We could not load your portfolio items just now.",
        ),
      );
    } finally {
      setItemsLoading(false);
    }
  }, [selectedLearnerId, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setItems([]);
      setPrograms([]);
      setProgramSegments([]);
      setCalendarItems([]);
      return;
    }

    void reloadItems();
  }, [
    reloadItems,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  async function handleToggleHighlight(item: CleanPortfolioItem) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      if (item.highlight) {
        await deleteCleanPortfolioHighlight(workspace.profile.id, item.highlight.id);
        setMessage("Removed from portfolio.");
      } else {
        await createCleanPortfolioHighlight(workspace.profile.id, {
          learnerId: item.evidence.learnerId,
          evidenceEntryId: item.evidence.id,
        });
        setMessage(
          items.some((portfolioItem) => portfolioItem.highlight)
            ? "Added to portfolio."
            : "First portfolio item added. You've chosen a meaningful piece of learning evidence.",
        );
      }

      await reloadItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not update this portfolio selection.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDeleteEvidence() {
    if (!workspace.profile || !pendingDeleteItem) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      if (pendingDeleteItem.highlight) {
        await deleteCleanPortfolioHighlight(
          workspace.profile.id,
          pendingDeleteItem.highlight.id,
        );
      }

      await deleteCleanEvidenceEntry(
        workspace.profile.id,
        pendingDeleteItem.evidence.id,
      );

      setPendingDeleteItem(null);
      setMessage("Evidence deleted.");
      await reloadItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete this evidence note.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const readyForPortfolio =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const selectedLearnerLabel =
    learnerOptions.find((option) => option.value === selectedLearnerId)?.label || "";
  const portfolioHeading = selectedLearnerLabel
    ? `${selectedLearnerLabel}'s portfolio`
    : "My Portfolio";

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />
        <CleanFirstRunSetupGate currentStep="portfolio" />
        <GuidanceSetupProgress
          stepId="portfolio"
          title="Review captured evidence."
          body="See how captured learning can become a clearer portfolio over time."
        />

        <CleanPageIntroVideo
          config={PAGE_INTRO_VIDEOS.myPortfolio}
          promptTitle="New to My Portfolio?"
          promptDescription="Watch a quick guide to see how to choose strong evidence and build a meaningful learning portfolio over time."
        />

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Choose evidence
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>{portfolioHeading}</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Portfolio is where you choose the strongest examples from your captured evidence.
            </p>
            <div>
              <GuidancePageAction tourId="my-portfolio" />
            </div>
          </div>
        </section>

        {workspace.loading ? (
          <V2LoadingState
            title="Preparing portfolio"
            body="We are bringing together the learning moments saved for this family."
          />
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              My Portfolio will not fall back to older portfolio or storage systems.
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
            <p style={{ margin: 0, color: "#475569" }}>
              Portfolio items are family-scoped in the clean rebuild. Create the family profile first on My Profile.
            </p>
          </section>
        ) : null}

        {readyForPortfolio && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              A learner is required before portfolio evidence can load.
            </p>
          </section>
        ) : null}

        {readyForPortfolio && workspace.profile && workspace.learners.length ? (
          <>
            <section data-guidance-id="portfolio-review-progress" style={cardStyle}>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Portfolio</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Portfolio is where you choose the strongest examples from your captured evidence. It is not every note - it is the evidence you may want to use in reports, reviews, or authority records.
                  </p>
                </div>
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>What should go into Portfolio?</strong>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#475569", lineHeight: 1.7 }}>
                    <li>Shows clear progress</li>
                    <li>Demonstrates independence</li>
                    <li>Links to an important pathway or curriculum area</li>
                    <li>Includes a strong parent observation</li>
                    <li>Supports reporting or review</li>
                    <li>Shows a meaningful piece of work</li>
                  </ul>
                </div>
              </div>
            </section>

            <section data-guidance-id="portfolio-filter-learner" style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Portfolio filters</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Start from captured evidence, then add the strongest pieces to the
                    portfolio rather than every note.
                  </p>
                </div>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => void reloadItems()}
                  disabled={itemsLoading || submitting}
                >
                  {itemsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  }}
                >
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search title, note, or pathway step"
                    style={inputStyle}
                  />
                  <select
                    value={selectedLearnerId}
                    onChange={(event) => setSelectedLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All family</option>
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedLearningArea}
                    onChange={(event) => setSelectedLearningArea(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All learning areas</option>
                    {learningAreaOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectionFilter}
                    onChange={(event) =>
                      setSelectionFilter(
                        event.target.value as "all" | "selected" | "not-selected",
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="all">All evidence</option>
                    <option value="selected">Selected for portfolio</option>
                    <option value="not-selected">Not selected yet</option>
                  </select>
                  <select
                    value={pathwayFilter}
                    onChange={(event) =>
                      setPathwayFilter(
                        event.target.value as "all" | "pathway-only" | "repeated-step",
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="all">All evidence types</option>
                    <option value="pathway-only">Pathway-linked only</option>
                    <option value="repeated-step">Several notes for one pathway step</option>
                  </select>
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={() => {
                      setSearchText("");
                      setSelectedLearningArea("");
                      setSelectionFilter("all");
                      setPathwayFilter("all");
                    }}
                    disabled={!searchText && !selectedLearningArea && selectionFilter === "all" && pathwayFilter === "all"}
                  >
                    Clear filters
                  </button>
                </div>
                <div style={{ marginTop: 12, color: "#64748b", lineHeight: 1.6 }}>
                  Showing <strong style={{ color: "#0f172a" }}>{filteredItems.length}</strong> of{" "}
                  <strong style={{ color: "#0f172a" }}>{items.length}</strong> evidence notes.
                </div>
              </div>
            </section>

            <section data-guidance-id="portfolio-evidence-list" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Captured evidence</h2>
              <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.6 }}>
                Unselected evidence is shown first so you can choose what belongs in the
                portfolio.
              </p>
              {filteredPathwayEvidenceSummary.repeatedSteps.length ? (
                <div style={{ ...helperCardStyle, marginBottom: 16 }}>
                  <strong style={{ color: "#0f172a" }}>
                    Choose the clearest evidence for repeated pathway steps
                  </strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    You have several evidence notes for the same pathway step. Choose the strongest example for your report.
                  </p>
                </div>
              ) : null}
              {itemsLoading ? (
                <p style={{ margin: 0, color: "#475569" }}>Loading portfolio cards...</p>
              ) : null}
              {itemsError ? <p style={{ margin: 0, color: "#b91c1c" }}>{itemsError}</p> : null}

              {!itemsLoading && !itemsError && !items.length ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  {selectedLearnerId
                    ? `No evidence is ready for ${learnerOptions.find((option) => option.value === selectedLearnerId)?.label || "this learner"}'s portfolio yet. Capture a useful note, observation, or work sample first.`
                    : "No evidence is ready for the portfolio yet. Capture a useful note, observation, or work sample first."}
                </p>
              ) : null}

              {!itemsLoading && !itemsError && items.length && !filteredItems.length ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  No evidence matches these filters yet.
                </p>
              ) : null}

              {!itemsLoading && !itemsError && sortedFilteredItems.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {sortedFilteredItems.map((item) => {
                    const learnerLabel =
                      learnerOptions.find(
                        (option) => option.value === item.evidence.learnerId,
                      )?.label || "Unknown learner";
                    const pathwayMeta =
                      filteredPathwayEvidenceSummary.stepByEvidenceId.get(item.evidence.id) ??
                      null;
                    const repeatedPathwayStep = pathwayMeta
                      ? (filteredPathwayEvidenceSummary.stepCounts.get(pathwayMeta.key)?.count ??
                          0) > 1
                      : false;
                    const linkedProgram = item.evidence.programId
                      ? programLabelById.get(item.evidence.programId) ?? null
                      : null;
                    const linkedCalendarItem = item.evidence.calendarItemId
                      ? calendarItemById.get(item.evidence.calendarItemId) ?? null
                      : null;
                    const linkedSegment =
                      linkedCalendarItem?.programSegmentId
                        ? segmentLabelById.get(linkedCalendarItem.programSegmentId) ?? null
                        : null;

                    return (
                      <div
                        data-guidance-id="portfolio-evidence-card"
                        key={item.evidence.id}
                        style={{
                          border: item.isHighlighted
                            ? "2px solid #1d4ed8"
                            : "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong>{portfolioCardTitle(item)}</strong>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {formatDateLabel(item.evidence.observedOn)} - {learnerLabel}
                              {item.evidence.learningArea
                                ? ` - ${item.evidence.learningArea}`
                                : ""}
                            </div>
                          </div>
                        </div>
                        {!item.evidence.title ? (
                          <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                            {item.evidence.whatHappened}
                          </p>
                        ) : (
                          <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                            {item.evidence.whatHappened}
                          </p>
                        )}
                        {pathwayMeta ? (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              alignItems: "center",
                              color: "#475569",
                              fontSize: 13,
                              lineHeight: 1.6,
                            }}
                          >
                            <span>Pathway: {pathwayMeta.label}</span>
                            {pathwayMeta.assessmentConfidence ? (
                              <span>Assessment: {pathwayMeta.assessmentConfidence}</span>
                            ) : null}
                            {pathwayMeta.observedSkillStatus ? (
                              <span>Observed: {pathwayMeta.observedSkillStatus}</span>
                            ) : null}
                            {repeatedPathwayStep ? (
                              <span
                                style={{
                                  borderRadius: 999,
                                  padding: "4px 10px",
                                  background: "#eef2ff",
                                  color: "#4338ca",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Multiple notes for this step
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {linkedProgram || linkedSegment || linkedCalendarItem ? (
                          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                            {linkedProgram ? `Program: ${linkedProgram}` : ""}
                            {linkedProgram && linkedSegment ? " | " : ""}
                            {linkedSegment ? `Week / segment: ${linkedSegment}` : ""}
                            {(linkedProgram || linkedSegment) && linkedCalendarItem ? " | " : ""}
                            {linkedCalendarItem ? `Block: ${linkedCalendarItem.title}` : ""}
                          </div>
                        ) : null}
                        <div data-guidance-id="portfolio-reflection-note" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={{
                              ...buttonStyle,
                              background: item.isHighlighted ? "#1d4ed8" : "#0f172a",
                              borderColor: item.isHighlighted ? "#1d4ed8" : "#0f172a",
                            }}
                            onClick={() => void handleToggleHighlight(item)}
                            disabled={submitting}
                          >
                            {item.isHighlighted ? "Remove from portfolio" : "Add to portfolio"}
                          </button>
                          <Link
                            href={`${capturePathBase}?evidence_entry_id=${item.evidence.id}`}
                            style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                          >
                            Open capture
                          </Link>
                          {item.isHighlighted ? (
                            <Link
                              href={`${reportsPathBase}?learner_id=${item.evidence.learnerId}&evidence_entry_id=${item.evidence.id}`}
                              style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                            >
                              Use in report
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            style={{
                              ...buttonStyle,
                              background: "#b91c1c",
                              borderColor: "#b91c1c",
                            }}
                            onClick={() => setPendingDeleteItem(item)}
                            disabled={submitting}
                          >
                            Delete evidence
                          </button>
                          {item.isHighlighted ? (
                            <span style={{ color: "#0f766e", fontWeight: 700 }}>
                              In portfolio
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <section data-guidance-id="portfolio-next-reports" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Next step: My Reports</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                When portfolio evidence is ready, preview how it can become a clearer
                learning record in My Reports.
              </p>
              <GuidanceSetupNextAction
                stepId="portfolio"
                nextHref={reportsPathBase}
                label="Continue to My Reports"
                helperText="You have reviewed how portfolio evidence is gathered. Continue to report preview."
              />
              <Link href={reportsPathBase} style={buttonStyle}>
                Open My Reports
              </Link>
            </section>
          </>
        ) : null}

        {message ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#0f766e" }}>{message}</p>
          </section>
        ) : null}

        {actionError ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{actionError}</p>
          </section>
        ) : null}

        {pendingDeleteItem ? (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.35)",
              display: "grid",
              placeItems: "center",
              padding: 20,
              zIndex: 50,
            }}
          >
            <div
              style={{
                width: "min(100%, 520px)",
                border: "1px solid #fecaca",
                borderRadius: 18,
                background: "#ffffff",
                padding: 20,
                boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                  Delete this evidence note?
                </h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  This removes it from My Capture, Portfolio, Reports, and Outputs. This
                  cannot be undone.
                </p>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {portfolioCardTitle(pendingDeleteItem)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => setPendingDeleteItem(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: "#b91c1c",
                    borderColor: "#b91c1c",
                  }}
                  onClick={() => void handleConfirmDeleteEvidence()}
                  disabled={submitting}
                >
                  {submitting ? "Deleting..." : "Delete evidence"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanPortfolioWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanPortfolioWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  createCleanPortfolioHighlight,
  deleteCleanPortfolioHighlight,
  listCleanPortfolioItems,
} from "@/lib/clean/portfolio/client";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type { CleanProgram, CleanProgramSegment } from "@/lib/clean/programs/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
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

type PathwayStepEvidenceMeta = {
  key: string;
  label: string;
};

function getPathwayStepEvidenceMeta(item: CleanPortfolioItem): PathwayStepEvidenceMeta | null {
  const context = parsePathwayContextFromNodeIds(item.evidence.curriculumNodeIds);
  if (!context?.stepNumber || !context.stepTitle) return null;

  return {
    key: [
      item.evidence.learnerId,
      context.pathwayKey || context.pathwayLabel || "pathway",
      context.stageKey || context.stageLabel || "stage",
      context.stepNumber,
    ].join("::"),
    label: `Step ${context.stepNumber} - ${context.stepTitle}`,
  };
}

function CleanPortfolioWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [items, setItems] = useState<CleanPortfolioItem[]>([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [calendarItems, setCalendarItems] = useState<CleanCalendarItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
        setMessage("Added to portfolio.");
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

  const readyForPortfolio =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />

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
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Portfolio</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Portfolio is where you choose the strongest examples from your captured evidence.
            </p>
          </div>
        </section>

        {workspace.loading ? (
          <section style={cardStyle}>Loading your family workspace...</section>
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
            <section style={cardStyle}>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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

            <section style={cardStyle}>
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
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Captured evidence</h2>
              {pathwayEvidenceSummary.repeatedSteps.length ? (
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
                  No evidence is ready for the portfolio yet.
                </p>
              ) : null}

              {!itemsLoading && !itemsError && items.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {items.map((item) => {
                    const learnerLabel =
                      learnerOptions.find(
                        (option) => option.value === item.evidence.learnerId,
                      )?.label || "Unknown learner";
                    const pathwayMeta =
                      pathwayEvidenceSummary.stepByEvidenceId.get(item.evidence.id) ?? null;
                    const repeatedPathwayStep = pathwayMeta
                      ? (pathwayEvidenceSummary.stepCounts.get(pathwayMeta.key)?.count ?? 0) > 1
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
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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

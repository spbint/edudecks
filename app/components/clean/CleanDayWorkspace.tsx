"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanGuidanceRibbon from "@/app/components/clean/CleanGuidanceRibbon";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { buildCleanGuidanceCards } from "@/lib/clean/guidance/client";
import type { CleanGuidanceCard } from "@/lib/clean/guidance/types";
import { listCleanPortfolioHighlights } from "@/lib/clean/portfolio/client";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type {
  CleanProgram,
  CleanProgramSegment,
} from "@/lib/clean/programs/types";
import { listCleanReports } from "@/lib/clean/reports/client";
import { listCleanMasterTemplates } from "@/lib/clean/templates/client";
import {
  listCleanAcademicYears,
  listCleanLearningPeriods,
} from "@/lib/clean/terms/client";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1040,
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const compactInputStyle: React.CSSProperties = {
  ...inputStyle,
  width: "min(260px, 100%)",
  padding: "9px 12px",
  fontSize: 13,
};

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(dateValue: string, dayOffset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setDate(date.getDate() + dayOffset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getWeekStart(dateValue = getTodayDate()) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return getTodayDate();
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatTodayHeading(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeLabel(value: string | null) {
  if (!value) return "Any time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function getPreviewText(value: string | null, maxLength = 110) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function CleanDayWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [items, setItems] = useState<CleanCalendarItem[]>([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [guidanceCards, setGuidanceCards] = useState<CleanGuidanceCard[]>([]);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);

  const today = getTodayDate();
  const weekStart = getWeekStart(today);
  const weekEnd = addDays(weekStart, 6);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const visibleItems = useMemo(() => {
    if (!selectedLearnerId) return items;
    return items.filter(
      (item) => item.learnerId === selectedLearnerId || item.learnerId === null,
    );
  }, [items, selectedLearnerId]);

  const sortedVisibleItems = useMemo(
    () =>
      [...visibleItems].sort((left, right) => {
        const leftTime = left.startsAt ?? "";
        const rightTime = right.startsAt ?? "";

        if (leftTime && rightTime) {
          return leftTime.localeCompare(rightTime);
        }

        if (leftTime) return -1;
        if (rightTime) return 1;

        return left.title.localeCompare(right.title);
      }),
    [visibleItems],
  );

  const openGuidanceCards = useMemo(() => guidanceCards.slice(0, 3), [guidanceCards]);
  const hasLateStageGuidance = useMemo(
    () => openGuidanceCards.some((card) => card.key === "portfolio" || card.key === "reports"),
    [openGuidanceCards],
  );

  const learnerLabelById = useMemo(
    () => new Map(learnerOptions.map((option) => [option.value, option.label])),
    [learnerOptions],
  );

  const programLabelById = useMemo(
    () => new Map(programs.map((program) => [program.id, program.title])),
    [programs],
  );

  const segmentLabelById = useMemo(
    () => new Map(programSegments.map((segment) => [segment.id, segment.title])),
    [programSegments],
  );

  const learnersInViewCount = useMemo(
    () => new Set(sortedVisibleItems.map((item) => item.learnerId).filter(Boolean)).size,
    [sortedVisibleItems],
  );

  const wholeFamilyBlocksCount = useMemo(
    () => sortedVisibleItems.filter((item) => item.learnerId === null).length,
    [sortedVisibleItems],
  );

  const nextUpcomingItem = useMemo(
    () => {
      const now = new Date();

      return (
        sortedVisibleItems.find((item) => {
          if (!item.startsAt) return false;
          const startsAt = new Date(item.startsAt);
          return !Number.isNaN(startsAt.getTime()) && startsAt >= now;
        }) ?? null
      );
    },
    [sortedVisibleItems],
  );

  const selectedLearnerLabel = useMemo(
    () => learnerOptions.find((option) => option.value === selectedLearnerId)?.label ?? null,
    [learnerOptions, selectedLearnerId],
  );

  const overviewSummary = useMemo(() => {
    if (!sortedVisibleItems.length) {
      return "Nothing planned for today yet.";
    }

    if (selectedLearnerId && selectedLearnerLabel) {
      return `Today has ${sortedVisibleItems.length} planned block${
        sortedVisibleItems.length === 1 ? "" : "s"
      } for ${selectedLearnerLabel}.`;
    }

    if (learnersInViewCount > 0) {
      return `Today has ${sortedVisibleItems.length} planned block${
        sortedVisibleItems.length === 1 ? "" : "s"
      } across ${learnersInViewCount} learner${learnersInViewCount === 1 ? "" : "s"}${
        wholeFamilyBlocksCount ? ", plus whole-family time." : "."
      }`;
    }

    return `Today has ${sortedVisibleItems.length} planned block${
      sortedVisibleItems.length === 1 ? "" : "s"
    } for the whole family.`;
  }, [
    learnersInViewCount,
    selectedLearnerId,
    selectedLearnerLabel,
    sortedVisibleItems,
    wholeFamilyBlocksCount,
  ]);

  useEffect(() => {
    if (!workspace.learners.length) {
      setSelectedLearnerId("");
      return;
    }

    setSelectedLearnerId((current) => {
      if (current && workspace.learners.some((learner) => learner.id === current)) {
        return current;
      }

      return "";
    });
  }, [workspace.learners]);

  useEffect(() => {
    async function loadItems() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
        setItems([]);
        setPrograms([]);
        setProgramSegments([]);
        return;
      }

      setItemsLoading(true);
      setItemsError(null);
      try {
        const [nextItems, nextPrograms] = await Promise.all([
          listCleanCalendarItems(workspace.profile.id, {
            fromDate: today,
            toDate: today,
            limit: 40,
          }),
          listCleanPrograms(workspace.profile.id, { limit: 50 }),
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
      } catch (error) {
        setItemsError(
          normalizeCleanErrorMessage(
            error,
            "We could not load today's learning blocks.",
          ),
        );
      } finally {
        setItemsLoading(false);
      }
    }

    void loadItems();
  }, [today, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  useEffect(() => {
    async function loadGuidance() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
        setGuidanceCards([]);
        return;
      }

      setGuidanceLoading(true);
      setGuidanceError(null);

      try {
        const [
          academicYears,
          learningPeriods,
          masterTemplates,
          programs,
          currentWeekItems,
          todayItems,
          evidenceEntries,
          portfolioHighlights,
          reports,
        ] = await Promise.all([
          listCleanAcademicYears(workspace.profile.id, { limit: 1 }),
          listCleanLearningPeriods(workspace.profile.id, { limit: 1 }),
          listCleanMasterTemplates(workspace.profile.id, { limit: 1 }),
          listCleanPrograms(workspace.profile.id, { limit: 1 }),
          listCleanCalendarItems(workspace.profile.id, {
            fromDate: weekStart,
            toDate: weekEnd,
            limit: 1,
          }),
          listCleanCalendarItems(workspace.profile.id, {
            fromDate: today,
            toDate: today,
            limit: 1,
          }),
          listCleanEvidenceEntries(workspace.profile.id, { limit: 1 }),
          listCleanPortfolioHighlights(workspace.profile.id, { limit: 1 }),
          listCleanReports(workspace.profile.id, { limit: 1 }),
        ]);

        const nextCards = buildCleanGuidanceCards({
          hasFamilyProfile: Boolean(workspace.profile),
          learnerCount: workspace.learners.length,
          hasJurisdictionProfile: Boolean(
            workspace.profile.countryCode ||
              workspace.profile.jurisdictionCode ||
              workspace.profile.curriculumFrameworkId,
          ),
          hasAcademicYear: academicYears.length > 0,
          hasLearningPeriods: learningPeriods.length > 0,
          hasMasterTemplate: masterTemplates.length > 0,
          hasPrograms: programs.length > 0,
          hasCurrentWeekItems: currentWeekItems.length > 0,
          hasTodayItems: todayItems.length > 0,
          hasEvidence: evidenceEntries.length > 0,
          hasPortfolioHighlights: portfolioHighlights.length > 0,
          hasReports: reports.length > 0,
        });

        setGuidanceCards(nextCards);
      } catch (error) {
        setGuidanceError(
          normalizeCleanErrorMessage(
            error,
            "We could not load your next steps just now.",
          ),
        );
      } finally {
        setGuidanceLoading(false);
      }
    }

    void loadGuidance();
  }, [
    today,
    weekEnd,
    weekStart,
    workspace.learners.length,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  function toggleExpanded(itemId: string) {
    setExpandedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId],
    );
  }

  const readyForDay = !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const hasPlannedItemsToday = items.length > 0;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
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
              Family day
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Day</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              {formatTodayHeading(today)}
            </p>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              A calm view of today&apos;s flow for the whole family.
            </p>
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading your day...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>My Day is not ready yet.</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              Finish the family setup first, then come back here for today&apos;s flow.
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
            <p style={{ margin: 0, color: "#475569" }}>
              Create your family profile first on <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForDay && !workspace.learners.length ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner first on <Link href="/my-profile">My Profile</Link> before using My Day.
            </p>
          </section>
        ) : null}

        {readyForDay && workspace.learners.length ? (
          <>
            {guidanceLoading ? (
              <section style={cardStyle}>
                <p style={{ margin: 0, color: "#475569" }}>Loading your next steps...</p>
              </section>
            ) : null}

            {!guidanceLoading && guidanceError ? (
              <section style={cardStyle}>
                <p style={{ margin: 0, color: "#b91c1c" }}>{guidanceError}</p>
              </section>
            ) : null}

            {!guidanceLoading &&
            !guidanceError &&
            !hasPlannedItemsToday &&
            !hasLateStageGuidance &&
            openGuidanceCards.length ? (
              <CleanGuidanceRibbon cards={openGuidanceCards} />
            ) : null}

            <section style={cardStyle}>
              <div
                style={{
                  display: "grid",
                  gap: 18,
                }}
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
                  <div style={{ display: "grid", gap: 8 }}>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Today&apos;s flow</h2>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      {overviewSummary}
                    </p>
                    {nextUpcomingItem ? (
                      <p style={{ margin: 0, color: "#334155", fontWeight: 700 }}>
                        Next up: {nextUpcomingItem.title} at {formatTimeLabel(nextUpcomingItem.startsAt)}.
                      </p>
                    ) : null}
                  </div>
                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <label
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Family day view
                    </label>
                    <select
                      value={selectedLearnerId}
                      onChange={(event) => setSelectedLearnerId(event.target.value)}
                      style={compactInputStyle}
                    >
                      <option value="">All family</option>
                      {learnerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 16,
                    background: "#f8fbff",
                    padding: 16,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>{formatTodayHeading(today)}</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {selectedLearnerId && selectedLearnerLabel
                      ? `You are looking at ${selectedLearnerLabel}'s day.`
                      : "You are looking at the full family day."}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    {sortedVisibleItems.length} learning block{sortedVisibleItems.length === 1 ? "" : "s"} in this view
                  </div>
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
                  <div>
                    <strong style={{ color: "#0f172a" }}>Family timeline</strong>
                    <p style={{ margin: "8px 0 0", color: "#475569" }}>
                      Learning blocks stay compact until you open the details.
                    </p>
                  </div>
                  <Link href="/my-calendar" style={{ color: "#1d4ed8", fontWeight: 700 }}>
                    Open My Calendar
                  </Link>
                </div>

              {itemsLoading ? <p style={{ marginTop: 0, marginBottom: 0, color: "#475569" }}>Loading today&apos;s flow...</p> : null}
              {itemsError ? <p style={{ marginTop: 16, marginBottom: 0, color: "#b91c1c" }}>{itemsError}</p> : null}

              {!itemsLoading && !itemsError && !visibleItems.length ? (
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    background: "#f8fafc",
                    padding: 18,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <strong style={{ color: "#0f172a" }}>
                      {hasPlannedItemsToday && selectedLearnerLabel
                        ? `Nothing planned for ${selectedLearnerLabel} today yet.`
                        : "Nothing planned for today yet."}
                    </strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      {hasPlannedItemsToday && selectedLearnerLabel
                        ? "Try the full family view, or open My Calendar to adjust today."
                        : "Open My Calendar to plan the week, or add one quick block for today."}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                      href="/my-calendar"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #0f172a",
                        background: "#0f172a",
                        color: "#ffffff",
                        borderRadius: 10,
                        padding: "10px 14px",
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Open My Calendar
                    </Link>
                    <Link
                      href="/my-calendar"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0f172a",
                        borderRadius: 10,
                        padding: "10px 14px",
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Add a quick block
                    </Link>
                  </div>
                </div>
              ) : null}

              {!itemsLoading && !itemsError && visibleItems.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {sortedVisibleItems.map((item) => {
                    const learnerLabel =
                      learnerLabelById.get(item.learnerId ?? "") || "Whole family";
                    const expanded = expandedItemIds.includes(item.id);
                    const programLabel = item.programId
                      ? programLabelById.get(item.programId) ?? null
                      : null;
                    const segmentLabel = item.programSegmentId
                      ? segmentLabelById.get(item.programSegmentId) ?? null
                      : null;
                    const notesPreview = getPreviewText(item.description);

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid #dbeafe",
                          borderRadius: 18,
                          background: "#ffffff",
                          padding: 0,
                          display: "grid",
                          overflow: "hidden",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 16,
                            alignItems: "flex-start",
                            padding: 16,
                            background: expanded ? "#f8fbff" : "#ffffff",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              minWidth: 88,
                              display: "grid",
                              gap: 2,
                              color: "#1d4ed8",
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            <span>{formatTimeLabel(item.startsAt)}</span>
                            {item.endsAt ? (
                              <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                                to {formatTimeLabel(item.endsAt)}
                              </span>
                            ) : null}
                          </div>
                          <div style={{ display: "grid", gap: 8, flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                              }}
                            >
                              <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                              <span style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                                {expanded ? "Hide details" : "Show details"}
                              </span>
                            </div>
                            <div style={{ color: "#64748b" }}>
                              {learnerLabel}
                              {item.learningArea ? ` - ${item.learningArea}` : ""}
                            </div>
                            {programLabel || segmentLabel ? (
                              <div style={{ color: "#475569", fontSize: 13 }}>
                                {programLabel ? `Program: ${programLabel}` : ""}
                                {programLabel && segmentLabel ? " - " : ""}
                                {segmentLabel ? `Segment: ${segmentLabel}` : ""}
                              </div>
                            ) : null}
                            {notesPreview ? (
                              <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                                {notesPreview}
                              </div>
                            ) : null}
                          </div>
                        </button>

                        {expanded ? (
                          <div
                            style={{
                              borderTop: "1px solid #e2e8f0",
                              padding: 16,
                              display: "grid",
                              gap: 10,
                            }}
                          >
                            {item.description ? (
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                {item.description}
                              </p>
                            ) : (
                              <p style={{ margin: 0, color: "#64748b" }}>
                                No extra notes yet for this learning block.
                              </p>
                            )}
                            {programLabel || segmentLabel ? (
                              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                {programLabel ? `Program: ${programLabel}` : ""}
                                {programLabel && segmentLabel ? " - " : ""}
                                {segmentLabel ? `Segment: ${segmentLabel}` : ""}
                              </div>
                            ) : null}
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              {/* TODO: pass learner/calendar/program context into My Capture when the capture route supports query-driven defaults. */}
                              <Link href="/my-capture" style={{ color: "#1d4ed8", fontWeight: 700 }}>
                                Capture what happened
                              </Link>
                              <Link href="/my-calendar" style={{ color: "#1d4ed8", fontWeight: 700 }}>
                                Open in My Calendar
                              </Link>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              </div>
            </section>

            {!guidanceLoading &&
            !guidanceError &&
            (hasPlannedItemsToday || hasLateStageGuidance) &&
            openGuidanceCards.length ? (
              <CleanGuidanceRibbon cards={openGuidanceCards} compact />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanDayWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanDayWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}

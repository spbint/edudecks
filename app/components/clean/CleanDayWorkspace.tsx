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
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { buildCleanGuidanceCards } from "@/lib/clean/guidance/client";
import type { CleanGuidanceCard } from "@/lib/clean/guidance/types";
import { listCleanPortfolioHighlights } from "@/lib/clean/portfolio/client";
import { listCleanPrograms } from "@/lib/clean/programs/client";
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

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
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

function CleanDayWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [items, setItems] = useState<CleanCalendarItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [guidanceCards, setGuidanceCards] = useState<CleanGuidanceCard[]>([]);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);

  const today = getTodayDate();

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

  const openGuidanceCards = useMemo(
    () => guidanceCards.filter((card) => card.status !== "done"),
    [guidanceCards],
  );

  useEffect(() => {
    if (!workspace.learners.length) {
      setSelectedLearnerId("");
      return;
    }

    setSelectedLearnerId((current) => {
      if (current && workspace.learners.some((learner) => learner.id === current)) {
        return current;
      }

      return workspace.profile?.defaultLearnerId || "";
    });
  }, [workspace.learners, workspace.profile]);

  useEffect(() => {
    async function loadItems() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
        setItems([]);
        return;
      }

      setItemsLoading(true);
      setItemsError(null);
      try {
        const nextItems = await listCleanCalendarItems(workspace.profile.id, {
          fromDate: today,
          toDate: today,
          limit: 40,
        });
        setItems(nextItems);
      } catch (error) {
        setItemsError(
          normalizeCleanErrorMessage(
            error,
            "We could not load today's clean calendar items.",
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
          anyCalendarItems,
          evidenceEntries,
          portfolioHighlights,
          reports,
        ] = await Promise.all([
          listCleanAcademicYears(workspace.profile.id, { limit: 1 }),
          listCleanLearningPeriods(workspace.profile.id, { limit: 1 }),
          listCleanMasterTemplates(workspace.profile.id, { limit: 1 }),
          listCleanPrograms(workspace.profile.id, { limit: 1 }),
          listCleanCalendarItems(workspace.profile.id, { limit: 1 }),
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
          hasCalendarItems: anyCalendarItems.length > 0,
          hasEvidence: evidenceEntries.length > 0,
          hasPortfolioHighlights: portfolioHighlights.length > 0,
          hasReports: reports.length > 0,
        });

        setGuidanceCards(nextCards);
      } catch (error) {
        setGuidanceError(
          normalizeCleanErrorMessage(
            error,
            "We could not load clean guidance just now.",
          ),
        );
      } finally {
        setGuidanceLoading(false);
      }
    }

    void loadGuidance();
  }, [workspace.learners.length, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  function toggleExpanded(itemId: string) {
    setExpandedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId],
    );
  }

  const readyForDay = !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

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
              Clean rebuild scaffold
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Day</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              {formatTodayHeading(today)}
            </p>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              My Day is extracted from the clean calendar and stays focused on daily clarity for the whole family.
            </p>
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading clean family workspace...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>{CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              The clean day scaffold only reads from the new family-only schema.
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
              Create a clean family profile first on <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForDay && !workspace.learners.length ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner first on <Link href="/my-profile">My Profile</Link> before using the clean daily view.
            </p>
          </section>
        ) : null}

        {readyForDay && workspace.learners.length ? (
          <>
            {guidanceLoading ? (
              <section style={cardStyle}>
                <p style={{ margin: 0, color: "#475569" }}>Loading setup guidance...</p>
              </section>
            ) : null}

            {!guidanceLoading && guidanceError ? (
              <section style={cardStyle}>
                <p style={{ margin: 0, color: "#b91c1c" }}>{guidanceError}</p>
              </section>
            ) : null}

            {!guidanceLoading && !guidanceError && openGuidanceCards.length ? (
              <CleanGuidanceRibbon cards={openGuidanceCards.slice(0, 5)} />
            ) : null}

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Today filter</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    The full family day is the default view. Use a learner filter only when you need to focus.
                  </p>
                </div>
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
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Today plan</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Visual day blocks come from clean calendar items only.
                  </p>
                </div>
                <Link href="/clean-my-calendar" style={{ color: "#1d4ed8", fontWeight: 700 }}>
                  Open clean calendar
                </Link>
              </div>

              {itemsLoading ? <p style={{ marginTop: 16, marginBottom: 0, color: "#475569" }}>Loading items for today...</p> : null}
              {itemsError ? <p style={{ marginTop: 16, marginBottom: 0, color: "#b91c1c" }}>{itemsError}</p> : null}

              {!itemsLoading && !itemsError && !visibleItems.length ? (
                <p style={{ marginTop: 16, marginBottom: 0, color: "#475569" }}>
                  Nothing planned for today yet.
                </p>
              ) : null}

              {!itemsLoading && !itemsError && visibleItems.length ? (
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  {visibleItems.map((item) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === item.learnerId)?.label ||
                      "Family / all learners";
                    const expanded = expandedItemIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid #cbd5e1",
                          borderRadius: 16,
                          background: "#ffffff",
                          padding: 16,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "grid", gap: 6 }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                alignItems: "center",
                              }}
                            >
                              <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#1d4ed8",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                }}
                              >
                                {item.sourceType}
                              </span>
                            </div>
                            <div style={{ color: "#475569" }}>
                              {formatTimeLabel(item.startsAt)}
                              {item.endsAt ? ` to ${formatTimeLabel(item.endsAt)}` : ""}
                            </div>
                            <div style={{ color: "#64748b" }}>
                              {learnerLabel}
                              {item.learningArea ? ` - ${item.learningArea}` : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.id)}
                            style={{
                              border: "1px solid #0f172a",
                              background: "#ffffff",
                              color: "#0f172a",
                              borderRadius: 10,
                              padding: "10px 14px",
                              fontSize: 14,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {expanded ? "Hide details" : "Show details"}
                          </button>
                        </div>

                        {expanded ? (
                          <div
                            style={{
                              borderTop: "1px solid #e2e8f0",
                              paddingTop: 12,
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            {item.description ? (
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                {item.description}
                              </p>
                            ) : (
                              <p style={{ margin: 0, color: "#64748b" }}>
                                No extra notes yet for this block.
                              </p>
                            )}
                            <div style={{ color: "#64748b" }}>
                              Quick capture comes next. Use{" "}
                              <Link href="/clean-my-capture">clean capture</Link> after the learning block.
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
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
